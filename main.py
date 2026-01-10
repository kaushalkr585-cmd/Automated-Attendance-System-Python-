import cv2
import os
import face_recognition
import pickle
import numpy as np
import cvzone
import firebase_admin
from firebase_admin import credentials, db, storage
from datetime import datetime

# ================= FIREBASE INIT =================
cred = credentials.Certificate("serviceAccountKey.json")
firebase_admin.initialize_app(
    cred,
    {
        "databaseURL": "https://automated-attendance-sys-7132e-default-rtdb.firebaseio.com/",
        "storageBucket": "automated-attendance-sys-7132e.appspot.com",
    },
)

bucket = storage.bucket()

# ================= CAMERA AUTO-DETECT =================
def get_working_camera(max_index=5):
    for i in range(max_index):
        cap = cv2.VideoCapture(i)
        if cap.isOpened():
            ret, _ = cap.read()
            if ret:
                print(f" Using camera index {i}")
                return cap
        cap.release()
    return None


CAM_WIDTH = 640
CAM_HEIGHT = 480

cap = get_working_camera()

if cap is None:
    print(" No camera found")
    exit()

cap.set(cv2.CAP_PROP_FRAME_WIDTH, CAM_WIDTH)
cap.set(cv2.CAP_PROP_FRAME_HEIGHT, CAM_HEIGHT)
cap.set(cv2.CAP_PROP_FPS, 30)

# ================= UI BACKGROUND =================
imgBackground = cv2.imread("Resources/background.png")

# ================= MODE IMAGES =================
folderModePath = "Resources/Modes"
modePathList = os.listdir(folderModePath)
imgModeList = [cv2.imread(os.path.join(folderModePath, p)) for p in modePathList]

# ================= LOAD ENCODINGS =================
print("Loading Encode File ...")
with open("EncodeFile.p", "rb") as file:
    encodeListKnown, studentIds = pickle.load(file)
print("Encode File Loaded")

# ================= VARIABLES =================
modeType = 0
counter = 0
id = -1
imgStudent = None
studentInfo = None

# ================= MAIN LOOP =================
while True:
    success, img = cap.read()
    if not success:
        continue

    #  FORCE SIZE (prevents broadcast error)
    img = cv2.resize(img, (CAM_WIDTH, CAM_HEIGHT))

    # ---------------- FACE DETECTION FRAME ----------------
    imgS = cv2.resize(img, (0, 0), None, 0.25, 0.25)
    imgS = cv2.cvtColor(imgS, cv2.COLOR_BGR2RGB)

    facesCurFrame = face_recognition.face_locations(imgS)
    encodesCurFrame = face_recognition.face_encodings(imgS, facesCurFrame)

    # ---------------- PLACE CAMERA & UI ----------------
    imgBackground[162 : 162 + CAM_HEIGHT, 55 : 55 + CAM_WIDTH] = img
    imgBackground[44 : 44 + 633, 808 : 808 + 414] = imgModeList[modeType]

    if facesCurFrame:
        for encodeFace, faceLoc in zip(encodesCurFrame, facesCurFrame):
            matches = face_recognition.compare_faces(encodeListKnown, encodeFace)
            faceDis = face_recognition.face_distance(encodeListKnown, encodeFace)

            matchIndex = np.argmin(faceDis)

            if matches[matchIndex]:
                y1, x2, y2, x1 = faceLoc
                y1, x2, y2, x1 = y1 * 4, x2 * 4, y2 * 4, x1 * 4

                bbox = (55 + x1, 162 + y1, x2 - x1, y2 - y1)
                imgBackground = cvzone.cornerRect(imgBackground, bbox, rt=0)

                id = studentIds[matchIndex]

                if counter == 0:
                    cvzone.putTextRect(imgBackground, "Loading", (275, 400))
                    cv2.imshow("Face Attendance", imgBackground)
                    cv2.waitKey(1)
                    counter = 1
                    modeType = 1

        # ---------------- ATTENDANCE LOGIC ----------------
        if counter != 0:
            if counter == 1:
                ref = db.reference(f"Students/{id}")
                studentInfo = ref.get()

                if studentInfo is None:
                    counter = 0
                    modeType = 0
                    continue

                # -------- LOAD STUDENT IMAGE --------
                try:
                    # Try loading from local folder first
                    local_path = f"Images/{id}.png"
                    if os.path.exists(local_path):
                        imgStudent = cv2.imread(local_path)
                        if imgStudent is not None:
                            imgStudent = cv2.resize(imgStudent, (216, 216))
                            print(f" Loaded LOCAL image for student {id}")
                        else:
                            raise Exception("Failed to decode local image")
                    else:
                        # Try Firebase Storage
                        print(f"🔍 Looking for Images/{id}.png in Firebase Storage...")
                        blob = bucket.get_blob(f"Images/{id}.png")
                        
                        if blob is None:
                            print(f" Image not found: Images/{id}.png")
                            # Try .jpg as fallback
                            print(f"🔍 Trying Images/{id}.jpg...")
                            blob = bucket.get_blob(f"Images/{id}.jpg")
                        
                        if blob is not None:
                            array = np.frombuffer(blob.download_as_string(), np.uint8)
                            imgStudent = cv2.imdecode(array, cv2.IMREAD_COLOR)
                            imgStudent = cv2.resize(imgStudent, (216, 216))
                            print(f" Loaded FIREBASE image for student {id}")
                        else:
                            raise Exception("Image file not found in storage")
                        
                except Exception as e:
                    print(f" Error loading student image for ID {id}: {e}")
                    print(f" Make sure the image exists at: Images/{id}.png (local) or in Firebase Storage")
                    imgStudent = np.zeros((216, 216, 3), dtype=np.uint8)
                    cv2.putText(imgStudent, "No Image", (50, 108),
                                cv2.FONT_HERSHEY_SIMPLEX, 0.7, (255, 255, 255), 2)

                # -------- ATTENDANCE TIME CHECK --------
                last_time = studentInfo.get("last_attendance_time")

                if last_time:
                    last_time = datetime.strptime(last_time, "%Y-%m-%d %H:%M:%S")
                    secondsElapsed = (datetime.now() - last_time).total_seconds()
                else:
                    secondsElapsed = 999

                if secondsElapsed > 30:
                    ref.child("total_attendance").set(
                        studentInfo["total_attendance"] + 1
                    )
                    ref.child("last_attendance_time").set(
                        datetime.now().strftime("%Y-%m-%d %H:%M:%S")
                    )
                    studentInfo["total_attendance"] += 1
                else:
                    modeType = 3
                    counter = 0

            if modeType != 3:
                if 10 < counter < 20:
                    modeType = 2

                imgBackground[44 : 44 + 633, 808 : 808 + 414] = imgModeList[modeType]

                if counter <= 10:
                    cv2.putText(imgBackground, str(studentInfo["total_attendance"]), (861, 125),
                                cv2.FONT_HERSHEY_COMPLEX, 1, (255, 255, 255), 1)

                    cv2.putText(imgBackground, studentInfo["major"], (1006, 550),
                                cv2.FONT_HERSHEY_COMPLEX, 0.4, (255, 255, 255), 1)

                    cv2.putText(imgBackground, str(id), (1006, 493),
                                cv2.FONT_HERSHEY_COMPLEX, 0.4, (255, 255, 255), 1)

                    cv2.putText(imgBackground, studentInfo["standing"], (910, 625),
                                cv2.FONT_HERSHEY_COMPLEX, 0.4, (100, 100, 100), 1)

                    cv2.putText(imgBackground, str(studentInfo["year"]), (1025, 625),
                                cv2.FONT_HERSHEY_COMPLEX, 0.4, (100, 100, 100), 1)

                    cv2.putText(imgBackground, str(studentInfo["starting_year"]), (1125, 625),
                                cv2.FONT_HERSHEY_COMPLEX, 0.4, (100, 100, 100), 1)

                    (w, _), _ = cv2.getTextSize(
                        studentInfo["name"], cv2.FONT_HERSHEY_COMPLEX, 1, 1
                    )
                    offset = (414 - w) // 2
                    cv2.putText(imgBackground, studentInfo["name"], (808 + offset, 445),
                                cv2.FONT_HERSHEY_COMPLEX, 1, (50, 50, 50), 1)

                    #  PLACE STUDENT IMAGE IN THE MARKED AREA
                    if imgStudent is not None:
                        imgBackground[175 : 175 + 216, 909 : 909 + 216] = imgStudent

                counter += 1

                if counter >= 20:
                    counter = 0
                    modeType = 0
                    studentInfo = None
                    imgStudent = None

    else:
        counter = 0
        modeType = 0

    cv2.imshow("Face Attendance", imgBackground)
    cv2.waitKey(1)
cap.release()
cv2.destroyAllWindows()
