from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import os
import sys

from app.routes import patient
from app.routes import emergency
from app.routes import auth
from app.routes import hospital
from app.services.database import db


def _parse_cors_origins() -> list[str]:
    """Parse CORS_ALLOW_ORIGINS environment variable.
    
    Returns list of allowed origins. In local development, defaults to localhost:3000-3002.
    In production (Render), use explicit URLs from environment.
    """
    raw = os.getenv("CORS_ALLOW_ORIGINS", "")
    if not raw.strip():
        # Default for local development
        return [
            "http://localhost:3000",
            "http://localhost:3001",
            "http://localhost:3002",
            "http://127.0.0.1:3000",
            "http://127.0.0.1:3001",
            "http://127.0.0.1:3002",
        ]

    return [item.strip() for item in raw.split(",") if item.strip()]


# ──────────────────────────────────────────────────────────────────────
# FASTAPI APPLICATION SETUP
# ──────────────────────────────────────────────────────────────────────

app = FastAPI(
    title="Emergency Health Passport",
    description="QR-based emergency health access system with AI clinical support",
    version="1.0.0",
    docs_url="/docs",           # Swagger UI
    redoc_url="/redoc",         # ReDoc documentation
    openapi_url="/openapi.json" # OpenAPI schema
)

print("[startup] ✅ FastAPI application initialized")

# Create uploads directory if not exists (for file uploads)
os.makedirs("uploads", exist_ok=True)
print("[startup] 📁 Uploads directory ready: ./uploads")

# Mount static file directory for serving uploaded files
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

# ──────────────────────────────────────────────────────────────────────
# CORS (Cross-Origin Resource Sharing) CONFIGURATION
# ──────────────────────────────────────────────────────────────────────
# Required for frontend apps to access backend from different domains

cors_origins = _parse_cors_origins()
cors_regex = os.getenv("CORS_ALLOW_ORIGIN_REGEX", r"https://.*\\.onrender\\.com")

app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_origin_regex=cors_regex,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

print(f"[startup] 🔓 CORS enabled for origins: {cors_origins[:2]}... and regex: {cors_regex}")

# ──────────────────────────────────────────────────────────────────────
# DATABASE INITIALIZATION
# ──────────────────────────────────────────────────────────────────────
# Create TTL indexes on startup (idempotent - safe to run every restart)

from app.services.database import ensure_indexes
try:
    ensure_indexes()
    print("[startup] ✅ Database indexes created/verified")
except Exception as exc:
    # Keep API process alive even if index creation fails
    # /health and diagnostics remain accessible for monitoring
    print(f"[startup] ⚠️  Index creation failed (non-fatal): {exc}", file=sys.stderr)

# ──────────────────────────────────────────────────────────────────────
# ROUTE REGISTRATION
# ──────────────────────────────────────────────────────────────────────
# Include routers for patient, emergency, auth, and hospital features

app.include_router(emergency.router, tags=["Emergency Access"])
app.include_router(patient.router, tags=["Patient Records"])
app.include_router(auth.router, tags=["Authentication"])
app.include_router(hospital.router, tags=["Hospital Management"])

print("[startup] ✅ All routers registered")

# ──────────────────────────────────────────────────────────────────────
# HEALTH CHECK ENDPOINT
# ──────────────────────────────────────────────────────────────────────
# Render uses this to verify service is running and database is connected

@app.get("/health")
def health_check():
    """Health check endpoint for monitoring and load balancers.
    
    Returns:
        dict: Status, message, and database name
        
    Used by Render to verify service health every 10 seconds.
    If this endpoint fails, Render considers the service unhealthy.
    """
    return {
        "status": "OK",
        "message": "Backend is running successfully",
        "mongo_db": db.name,
        "environment": os.getenv("ENVIRONMENT", "development"),
    }

print("[startup] ✅ Health check endpoint ready: GET /health")
