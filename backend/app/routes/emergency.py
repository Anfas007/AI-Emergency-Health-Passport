from fastapi import APIRouter, HTTPException
from datetime import datetime
from app.services.token_service import generate_emergency_token
from app.services.emergency_store import save_token, validate_token
from app.services.database import patients_collection
from app.services.audit_service import log_emergency_access
from app.services.ai_service import run_emergency_ai
from app.models.emergency_input import EmergencyInput
router = APIRouter(prefix="/emergency", tags=["Emergency"])


# 1️⃣ Generate emergency token (QR uses this token)
@router.post("/request-access/{patient_id}")
def request_emergency_access(patient_id: str, role: str):
    patient = patients_collection.find_one({"patient_id": patient_id})

    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")

    token, expires_at = generate_emergency_token(minutes=15)

    save_token(token, patient_id, expires_at, role)

    return {
        "emergency_token": token,
        "expires_at": expires_at,
        "note": "Valid for emergency use only"
    }


# 2️⃣ Scan Emergency QR (token validation + data access)
@router.get("/scan/{token}")
def scan_emergency_qr(token: str):
    token_data = validate_token(token)

    if not token_data:
        raise HTTPException(status_code=403, detail="Invalid or expired token")

    patient = patients_collection.find_one(
        {"patient_id": token_data["patient_id"]},
        {
            "_id": 0,
            "name": 1,
            "blood_group": 1,
            "allergies": 1,
            "chronic_conditions": 1
        }
    )

    # Audit log
    log_emergency_access(
        token_data["patient_id"],
        token_data["role"]
    )

    return {
        "patient_id": token_data["patient_id"],
        "emergency_data": patient
    }

@router.post("/ai-triage")
def emergency_ai_triage(data: EmergencyInput):
    try:
        result = run_emergency_ai(data.dict())
        return result
    except Exception as e:
        import traceback
        print(f"Error in ai-triage: {e}")
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))