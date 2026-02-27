from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routes import patient
from app.routes import emergency
from app.routes import auth
from app.routes import hospital

app = FastAPI(
    title="AI Emergency Health Passport",
    description="QR-based AI-assisted emergency health access system",
    version="1.0.0"
)

# Allow the React dev server and any localhost origin
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://localhost:3001",
        "http://localhost:3002",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:3001",
        "http://127.0.0.1:3002",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Create TTL indexes on startup (idempotent)
from app.services.database import ensure_indexes
ensure_indexes()

app.include_router(emergency.router)
app.include_router(patient.router)
app.include_router(auth.router)
app.include_router(hospital.router)

@app.get("/health")
def health_check():
    return {
        "status": "OK",
        "message": "Backend is running successfully"
    }
