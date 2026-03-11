from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routes.recognize import router as recognize_router
from routes.attendance import router as attendance_router
from routes.students import router as students_router
from routes.encodings import router as encodings_router
from face_service import load_encodings
from firebase_service import initialize_firebase

app = FastAPI(
    title="AI Face Recognition Attendance System",
    description="Backend API for the futuristic AI-powered attendance system",
    version="1.0.0",
)

# ─── CORS ─────────────────────────────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000", "*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─── Startup ──────────────────────────────────────────────────────────────────
@app.on_event("startup")
async def startup_event():
    print("[Startup] Initializing Firebase...")
    initialize_firebase()
    print("[Startup] Loading face encodings...")
    load_encodings()
    print("[Startup] Ready!")

# ─── Routes ───────────────────────────────────────────────────────────────────
app.include_router(recognize_router, tags=["Recognition"])
app.include_router(attendance_router, tags=["Attendance"])
app.include_router(students_router, tags=["Students"])
app.include_router(encodings_router, tags=["Encodings"])


@app.get("/")
async def root():
    return {"message": "AI Face Recognition Attendance System API", "status": "running"}


@app.get("/health")
async def health():
    return {"status": "ok"}


# ─── Stats endpoint ───────────────────────────────────────────────────────────
from firebase_service import get_all_students, get_today_attendance_count

@app.get("/stats")
async def get_stats():
    try:
        students = get_all_students()
        today_count = get_today_attendance_count()
        return {
            "total_students": len(students),
            "today_attendance": today_count,
            "total_attendance": sum(s.get("total_attendance", 0) for s in students.values()),
        }
    except Exception as e:
        return {"error": str(e)}
