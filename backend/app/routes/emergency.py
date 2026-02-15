from fastapi import APIRouter, HTTPException
from datetime import datetime
from app.services.token_service import generate_emergency_token
from app.services.database import patients_collection

router = APIRouter(prefix="/emergency", tags=["Emergency"])

@router.post("/request-access/{patient_id}")
def request_emergency_access(patient_id: str, role: str):
    patient = patients_collection.find_one({"patient_id": patient_id})

    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")

    token, expires_at = generate_emergency_token()

    return {
        "emergency_token": token,
        "expires_at": expires_at,
        "allowed_data": "Emergency medical summary only"
    }
