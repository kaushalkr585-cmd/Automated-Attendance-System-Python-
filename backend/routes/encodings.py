from fastapi import APIRouter
from face_service import generate_all_encodings

router = APIRouter()


@router.post("/generate-encodings")
async def generate_encodings():
    """Regenerate face encodings from all student images."""
    result = generate_all_encodings()
    return result
