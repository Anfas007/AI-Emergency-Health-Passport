from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import os

from app.routes import patient
from app.routes import emergency
from app.routes import auth
from app.routes import hospital
from app.services.database import db


def _parse_cors_origins() -> list[str]:
    raw = os.getenv("CORS_ALLOW_ORIGINS", "")
    if not raw.strip():
        return [
            "http://localhost:3000",
            "http://localhost:3001",
            "http://localhost:3002",
            "http://127.0.0.1:3000",
            "http://127.0.0.1:3001",
            "http://127.0.0.1:3002",
        ]

    return [item.strip() for item in raw.split(",") if item.strip()]

app = FastAPI(
    title="Emergency Health Passport",
    description="QR-based emergency health access system",
    version="1.0.0"
)

# Create uploads directory if not exists
os.makedirs("uploads", exist_ok=True)
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

# CORS: local dev origins by default, overridable via CORS_ALLOW_ORIGINS.
app.add_middleware(
    CORSMiddleware,
    allow_origins=_parse_cors_origins(),
    allow_origin_regex=os.getenv("CORS_ALLOW_ORIGIN_REGEX", r"https://.*\\.onrender\\.com"),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Create TTL indexes on startup (idempotent)
from app.services.database import ensure_indexes
try:
    ensure_indexes()
except Exception as exc:
    # Keep API process alive so /health and diagnostics remain accessible.
    print(f"[startup] ensure_indexes failed: {exc}")

app.include_router(emergency.router)
app.include_router(patient.router)
app.include_router(auth.router)
app.include_router(hospital.router)

@app.get("/health")
def health_check():
    return {
        "status": "OK",
        "message": "Backend is running successfully",
        "mongo_db": db.name,
    }
