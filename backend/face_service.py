import face_recognition
import pickle
import numpy as np
import cv2
import os
from firebase_service import download_student_image, get_all_students

# ─── In-Memory State ─────────────────────────────────────────────────────────
_encode_list: list = []
_student_ids: list = []
_encodings_loaded = False

ENCODE_FILE = os.path.join(os.path.dirname(__file__), "..", "EncodeFile.p")
IMAGES_DIR  = os.path.join(os.path.dirname(__file__), "..", "Images")

# ─── Detection config (tune here) ────────────────────────────────────────────
DETECTION_SCALE  = 0.5          # 50% — better accuracy than 25%
TOLERANCE        = 0.55         # slightly relaxed from 0.5
UPSAMPLE_TIMES   = 1            # HOG upsample for small/distant faces
MODEL            = "hog"        # "hog" = CPU-friendly; swap to "cnn" if GPU


def load_encodings():
    """Load face encodings from EncodeFile.p if it exists."""
    global _encode_list, _student_ids, _encodings_loaded
    encode_path = os.path.abspath(ENCODE_FILE)
    if os.path.exists(encode_path):
        with open(encode_path, "rb") as f:
            data = pickle.load(f)
            _encode_list, _student_ids = data[0], data[1]
        print(f"[FaceService] Loaded {len(_encode_list)} encodings from EncodeFile.p")
    else:
        print("[FaceService] EncodeFile.p not found — encodings not loaded.")
    _encodings_loaded = True


def _preprocess(img_rgb: np.ndarray) -> np.ndarray:
    """
    Improve detection rate with:
    - Equalise luminance in YCrCb space (handles poor lighting)
    - Mild Gaussian blur to reduce webcam noise
    """
    ycrcb = cv2.cvtColor(img_rgb, cv2.COLOR_RGB2YCrCb)
    ycrcb[:, :, 0] = cv2.equalizeHist(ycrcb[:, :, 0])
    enhanced = cv2.cvtColor(ycrcb, cv2.COLOR_YCrCb2RGB)
    return cv2.GaussianBlur(enhanced, (3, 3), 0)


def _bytes_to_rgb_array(image_bytes: bytes) -> np.ndarray:
    """Convert raw image bytes (JPEG/PNG) to an RGB numpy array."""
    nparr = np.frombuffer(image_bytes, np.uint8)
    img_bgr = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
    if img_bgr is None:
        raise ValueError("Could not decode image bytes")
    return cv2.cvtColor(img_bgr, cv2.COLOR_BGR2RGB)


def _detect_faces_multiscale(img_rgb: np.ndarray):
    """
    Try detection at DETECTION_SCALE first; if no face found, retry at full
    resolution so distant/small faces are still caught.
    Returns (face_locs_on_full_img, face_encs_from_scaled_img)
    """
    scale = DETECTION_SCALE
    small = cv2.resize(img_rgb, (0, 0), None, scale, scale)
    small_pre = _preprocess(small)

    locs = face_recognition.face_locations(small_pre, number_of_times_to_upsample=UPSAMPLE_TIMES, model=MODEL)
    encs = face_recognition.face_encodings(small_pre, locs, num_jitters=2)

    inv = 1.0 / scale
    locs_full = [(int(t*inv), int(r*inv), int(b*inv), int(l*inv)) for (t, r, b, l) in locs]

    # --- fallback: full-res detection (slower, better for small faces) ---
    if not locs:
        pre_full = _preprocess(img_rgb)
        locs_full = face_recognition.face_locations(pre_full, number_of_times_to_upsample=UPSAMPLE_TIMES, model=MODEL)
        encs = face_recognition.face_encodings(pre_full, locs_full, num_jitters=2)
        print("[FaceService] Fallback to full-res detection")

    return locs_full, encs


def recognize_face(image_bytes: bytes) -> dict:
    """
    Recognize a face in the image bytes.
    Returns: { matched, student_id, confidence, face_locations }
    """
    global _encode_list, _student_ids
    if not _encodings_loaded:
        load_encodings()

    if not _encode_list:
        return {"matched": False, "student_id": None, "confidence": 0.0,
                "face_locations": [], "error": "No encodings loaded — add students and generate encodings first."}

    try:
        img_rgb = _bytes_to_rgb_array(image_bytes)
        face_locs, face_encs = _detect_faces_multiscale(img_rgb)

        if not face_encs:
            return {"matched": False, "student_id": None, "confidence": 0.0, "face_locations": []}

        for enc, loc in zip(face_encs, face_locs):
            distances   = face_recognition.face_distance(_encode_list, enc)
            best_idx    = int(np.argmin(distances))
            best_dist   = float(distances[best_idx])
            confidence  = round((1.0 - best_dist) * 100.0, 2)

            # compare_faces with relaxed tolerance
            matches = face_recognition.compare_faces(_encode_list, enc, tolerance=TOLERANCE)

            print(f"[FaceService] Best distance={best_dist:.4f}, confidence={confidence}%, matched={matches[best_idx]}")

            if matches[best_idx]:
                return {
                    "matched":        True,
                    "student_id":     _student_ids[best_idx],
                    "confidence":     confidence,
                    "face_locations": [list(loc)],
                }

        # Face detected but not recognised
        return {
            "matched":        False,
            "student_id":     None,
            "confidence":     0.0,
            "face_locations": [list(face_locs[0])] if face_locs else [],
        }

    except Exception as e:
        print(f"[FaceService] Error in recognize_face: {e}")
        return {"matched": False, "student_id": None, "confidence": 0.0,
                "face_locations": [], "error": str(e)}


def add_encoding_from_bytes(student_id: str, image_bytes: bytes) -> bool:
    """Add / replace a face encoding from raw image bytes."""
    global _encode_list, _student_ids
    try:
        img_rgb  = _bytes_to_rgb_array(image_bytes)
        pre      = _preprocess(img_rgb)
        encodings = face_recognition.face_encodings(pre, num_jitters=5)

        if not encodings:
            # Try without preprocessing
            encodings = face_recognition.face_encodings(img_rgb, num_jitters=5)

        if not encodings:
            print(f"[FaceService] No face detected for student {student_id}")
            return False

        if student_id in _student_ids:
            idx = _student_ids.index(student_id)
            _encode_list.pop(idx)
            _student_ids.pop(idx)

        _encode_list.append(encodings[0])
        _student_ids.append(student_id)
        _save_encodings()
        print(f"[FaceService] ✓ Encoding added for {student_id}")
        return True

    except Exception as e:
        print(f"[FaceService] Error adding encoding for {student_id}: {e}")
        return False


def generate_all_encodings() -> dict:
    """Regenerate encodings from local Images/ folder and Firebase Storage."""
    global _encode_list, _student_ids
    encode_list = []
    student_ids = []
    failed      = []

    images_dir = os.path.abspath(IMAGES_DIR)
    sources    = {}

    # Local images take priority
    if os.path.exists(images_dir):
        for fname in os.listdir(images_dir):
            ext = os.path.splitext(fname)[1].lower()
            if ext in [".jpg", ".jpeg", ".png", ".bmp", ".webp"]:
                sid = os.path.splitext(fname)[0]
                sources[sid] = ("local", os.path.join(images_dir, fname))

    # Firebase images for students with no local image
    try:
        students = get_all_students()
        for sid in students:
            if sid not in sources:
                sources[sid] = ("firebase", sid)
    except Exception as e:
        print(f"[FaceService] Could not load Firebase students: {e}")

    for sid, (source, path_or_id) in sources.items():
        try:
            if source == "local":
                img_bgr = cv2.imread(path_or_id)
                if img_bgr is None:
                    raise ValueError("cv2.imread returned None")
                img_rgb = cv2.cvtColor(img_bgr, cv2.COLOR_BGR2RGB)
            else:
                img_bytes = download_student_image(path_or_id)
                if img_bytes is None:
                    raise ValueError("Image not found in Firebase Storage")
                img_rgb = _bytes_to_rgb_array(img_bytes)

            pre = _preprocess(img_rgb)

            # Higher jitter for robust training encodings
            encodings = face_recognition.face_encodings(pre, num_jitters=5)
            if not encodings:
                encodings = face_recognition.face_encodings(img_rgb, num_jitters=5)
            if not encodings:
                raise ValueError("No face detected after preprocessing")

            encode_list.append(encodings[0])
            student_ids.append(sid)
            print(f"[FaceService] ✓ Encoded {sid}")

        except Exception as e:
            print(f"[FaceService] ✗ Failed {sid}: {e}")
            failed.append(sid)

    _encode_list = encode_list
    _student_ids = student_ids
    _save_encodings()

    return {
        "success":     True,
        "encoded":     len(encode_list),
        "failed":      failed,
        "student_ids": student_ids,
    }


def _save_encodings():
    path = os.path.abspath(ENCODE_FILE)
    with open(path, "wb") as f:
        pickle.dump([_encode_list, _student_ids], f)
    print(f"[FaceService] Saved {len(_encode_list)} encodings to EncodeFile.p")


def remove_encoding(student_id: str):
    """Remove encoding for a deleted student."""
    global _encode_list, _student_ids
    if student_id in _student_ids:
        idx = _student_ids.index(student_id)
        _encode_list.pop(idx)
        _student_ids.pop(idx)
        _save_encodings()
