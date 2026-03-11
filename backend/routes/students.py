from fastapi import APIRouter, HTTPException, File, UploadFile, Form
from firebase_service import (
    get_all_students,
    get_student,
    add_student,
    update_student,
    delete_student,
    upload_student_image,
)
from face_service import add_encoding_from_bytes, remove_encoding
import json

router = APIRouter()


@router.get("/students")
async def list_students():
    """Return all students as a list."""
    data = get_all_students()
    return {"students": list(data.values()), "total": len(data)}


@router.get("/students/{student_id}")
async def get_student_route(student_id: str):
    student = get_student(student_id)
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    return student


@router.post("/students")
async def add_student_route(
    student_id: str = Form(...),
    name: str = Form(...),
    major: str = Form(...),
    branch: str = Form(...),
    year: int = Form(...),
    starting_year: int = Form(...),
    standing: str = Form("Good"),
    image: UploadFile = File(None),
):
    """Add a new student with optional image upload."""
    # Check if student already exists
    existing = get_student(student_id)
    if existing:
        raise HTTPException(status_code=409, detail="Student ID already exists")

    profile_image_url = ""

    # Upload image if provided
    if image:
        image_bytes = await image.read()
        ext = image.filename.split(".")[-1].lower() if image.filename else "png"
        try:
            profile_image_url = upload_student_image(student_id, image_bytes, ext)
            # Also save locally
            import os
            images_dir = os.path.join(os.path.dirname(__file__), "..", "..", "Images")
            os.makedirs(images_dir, exist_ok=True)
            with open(os.path.join(images_dir, f"{student_id}.{ext}"), "wb") as f:
                f.write(image_bytes)
            # Generate encoding
            add_encoding_from_bytes(student_id, image_bytes)
        except Exception as e:
            print(f"Image upload error: {e}")

    student_data = {
        "name": name,
        "major": major,
        "branch": branch,
        "year": year,
        "starting_year": starting_year,
        "standing": standing,
        "profile_image_url": profile_image_url,
    }

    result = add_student(student_id, student_data)
    return result


@router.put("/students/{student_id}")
async def update_student_route(
    student_id: str,
    name: str = Form(None),
    major: str = Form(None),
    branch: str = Form(None),
    year: int = Form(None),
    starting_year: int = Form(None),
    standing: str = Form(None),
    image: UploadFile = File(None),
):
    updates = {}
    if name is not None: updates["name"] = name
    if major is not None: updates["major"] = major
    if branch is not None: updates["branch"] = branch
    if year is not None: updates["year"] = year
    if starting_year is not None: updates["starting_year"] = starting_year
    if standing is not None: updates["standing"] = standing

    if image:
        image_bytes = await image.read()
        ext = image.filename.split(".")[-1].lower() if image.filename else "png"
        try:
            url = upload_student_image(student_id, image_bytes, ext)
            updates["profile_image_url"] = url
            add_encoding_from_bytes(student_id, image_bytes)
        except Exception as e:
            print(f"Image update error: {e}")

    result = update_student(student_id, updates)
    if not result:
        raise HTTPException(status_code=404, detail="Student not found")
    return result


@router.delete("/students/{student_id}")
async def delete_student_route(student_id: str):
    success = delete_student(student_id)
    if not success:
        raise HTTPException(status_code=404, detail="Student not found")
    remove_encoding(student_id)
    return {"success": True, "deleted_id": student_id}
