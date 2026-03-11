from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from firebase_service import mark_attendance

router = APIRouter()


class AttendanceRequest(BaseModel):
    student_id: str


@router.post("/mark-attendance")
async def mark_attendance_route(body: AttendanceRequest):
    """
    Mark attendance for a student.
    Returns: { success, already_marked, updated_attendance }
    """
    result = mark_attendance(body.student_id)
    if not result.get("success"):
        raise HTTPException(status_code=404, detail=result.get("error", "Student not found"))
    return result
