from fastapi import APIRouter, File, UploadFile, HTTPException
from face_service import recognize_face
from firebase_service import get_student

router = APIRouter()


@router.post("/recognize")
async def recognize(file: UploadFile = File(...)):
    """
    Receive a webcam frame (JPEG/PNG) and return matched student info.
    Returns: { matched, student, confidence, face_locations }
    """
    try:
        image_bytes = await file.read()
        result = recognize_face(image_bytes)

        if result.get("matched") and result.get("student_id"):
            student = get_student(result["student_id"])
            if student:
                return {
                    "matched": True,
                    "student": student,
                    "confidence": result["confidence"],
                    "face_locations": result.get("face_locations", []),
                }

        return {
            "matched": False,
            "student": None,
            "confidence": result.get("confidence", 0.0),
            "face_locations": result.get("face_locations", []),
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
