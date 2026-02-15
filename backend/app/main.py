from fastapi import FastAPI
from app.routes import patient
from app.routes import emergency

app = FastAPI(
    title="AI Emergency Health Passport",
    description="QR-based AI-assisted emergency health access system",
    version="1.0.0"
)

app.include_router(emergency.router)
app.include_router(patient.router)

@app.get("/health")
def health_check():
    return {
        "status": "OK",
        "message": "Backend is running successfully"
    }
