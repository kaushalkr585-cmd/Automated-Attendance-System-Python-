import firebase_admin
from firebase_admin import credentials, db, storage
from datetime import datetime
import os
import io

# ─── Firebase Initialization ────────────────────────────────────────────────
_initialized = False

def initialize_firebase():
    global _initialized
    if _initialized:
        return
    try:
        firebase_admin.get_app()
        _initialized = True
    except ValueError:
        # Look for serviceAccountKey.json in parent directory (project root)
        key_path = os.path.join(os.path.dirname(__file__), "..", "serviceAccountKey.json")
        key_path = os.path.abspath(key_path)
        if not os.path.exists(key_path):
            raise FileNotFoundError(f"serviceAccountKey.json not found at {key_path}")
        cred = credentials.Certificate(key_path)
        firebase_admin.initialize_app(cred, {
            "databaseURL": "https://automated-attendance-sys-7132e-default-rtdb.firebaseio.com/",
            "storageBucket": "automated-attendance-sys-7132e.appspot.com",
        })
        _initialized = True


# ─── Student CRUD ────────────────────────────────────────────────────────────

def get_all_students() -> dict:
    initialize_firebase()
    ref = db.reference("Students")
    data = ref.get()
    if data is None:
        return {}
    # Inject student_id into each record
    result = {}
    for sid, info in data.items():
        info["student_id"] = sid
        result[sid] = info
    return result


def get_student(student_id: str) -> dict | None:
    initialize_firebase()
    ref = db.reference(f"Students/{student_id}")
    data = ref.get()
    if data:
        data["student_id"] = student_id
    return data


def add_student(student_id: str, student_data: dict) -> dict:
    initialize_firebase()
    ref = db.reference(f"Students/{student_id}")
    payload = {
        "name": student_data.get("name", ""),
        "major": student_data.get("major", ""),
        "branch": student_data.get("branch", ""),
        "year": int(student_data.get("year", 1)),
        "starting_year": int(student_data.get("starting_year", datetime.now().year)),
        "standing": student_data.get("standing", "Good"),
        "total_attendance": 0,
        "last_attendance_time": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
        "profile_image_url": student_data.get("profile_image_url", ""),
    }
    ref.set(payload)
    payload["student_id"] = student_id
    return payload


def update_student(student_id: str, updates: dict) -> dict | None:
    initialize_firebase()
    ref = db.reference(f"Students/{student_id}")
    existing = ref.get()
    if existing is None:
        return None
    allowed = ["name", "major", "branch", "year", "starting_year", "standing", "profile_image_url"]
    filtered = {k: v for k, v in updates.items() if k in allowed}
    ref.update(filtered)
    updated = ref.get()
    if updated:
        updated["student_id"] = student_id
    return updated


def delete_student(student_id: str) -> bool:
    initialize_firebase()
    ref = db.reference(f"Students/{student_id}")
    existing = ref.get()
    if existing is None:
        return False
    ref.delete()
    return True


# ─── Attendance ──────────────────────────────────────────────────────────────

def mark_attendance(student_id: str) -> dict:
    initialize_firebase()
    ref = db.reference(f"Students/{student_id}")
    student_info = ref.get()
    if student_info is None:
        return {"success": False, "error": "Student not found"}

    last_time_str = student_info.get("last_attendance_time")
    already_marked = False

    if last_time_str:
        try:
            last_time = datetime.strptime(last_time_str, "%Y-%m-%d %H:%M:%S")
            seconds_elapsed = (datetime.now() - last_time).total_seconds()
            if seconds_elapsed < 30:
                already_marked = True
        except Exception:
            pass

    if not already_marked:
        new_count = student_info.get("total_attendance", 0) + 1
        ref.update({
            "total_attendance": new_count,
            "last_attendance_time": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
        })
        return {
            "success": True,
            "already_marked": False,
            "updated_attendance": new_count,
        }
    else:
        return {
            "success": True,
            "already_marked": True,
            "updated_attendance": student_info.get("total_attendance", 0),
        }


# ─── Firebase Storage ─────────────────────────────────────────────────────────

def upload_student_image(student_id: str, image_bytes: bytes, extension: str = "png") -> str:
    initialize_firebase()
    bucket = storage.bucket()
    blob_path = f"Images/{student_id}.{extension}"
    blob = bucket.blob(blob_path)
    blob.upload_from_string(image_bytes, content_type=f"image/{extension}")
    blob.make_public()
    return blob.public_url


def download_student_image(student_id: str) -> bytes | None:
    initialize_firebase()
    bucket = storage.bucket()
    for ext in ["png", "jpg", "jpeg"]:
        blob = bucket.get_blob(f"Images/{student_id}.{ext}")
        if blob:
            return blob.download_as_bytes()
    return None


def get_today_attendance_count() -> int:
    """Count students who had attendance marked today."""
    initialize_firebase()
    ref = db.reference("Students")
    data = ref.get()
    if not data:
        return 0
    today = datetime.now().strftime("%Y-%m-%d")
    count = 0
    for info in data.values():
        last = info.get("last_attendance_time", "")
        if last.startswith(today):
            count += 1
    return count


def get_attendance_history() -> dict:
    """Return per-student attendance data and daily stats."""
    initialize_firebase()
    ref = db.reference("Students")
    data = ref.get()
    if not data:
        return {}
    return data
