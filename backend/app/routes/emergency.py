from fastapi import APIRouter, HTTPException, Header, Depends
from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from app.services.token_service import generate_emergency_token
from app.services.emergency_store import save_token, validate_token
from app.services.database import (
    patients_collection, doctor_decisions_collection,
    doctor_notes_collection, emergency_sessions_collection,
    shared_access_collection
)
from app.services.audit_service import log_emergency_access, get_all_logs, get_logs_for_patient, get_logs_for_doctor
from app.services.auth_service import decode_access_token, get_current_doctor
router = APIRouter(prefix="/emergency", tags=["Emergency"])

# ── Pydantic models for new endpoints ──

class DoctorDecisionInput(BaseModel):
    session_id: str
    decision: str            # "accept" or "override"
    reason: Optional[str] = ""
    severity: Optional[str] = ""
    possible_condition: Optional[str] = ""

class DoctorNotesInput(BaseModel):
    session_id: str
    notes: str


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
#    - role == "doctor"   → limited critical fields only
#    - role == "hospital" → full medical record (auto-shared on CRITICAL)
@router.get("/scan/{token}")
def scan_emergency_qr(token: str, authorization: str = Header(None)):
    token_data = validate_token(token)

    if not token_data:
        raise HTTPException(status_code=403, detail="Invalid or expired token")

    role = token_data.get("role", "doctor")
    patient_id = token_data["patient_id"]

    if role == "hospital":
        # Full medical record for authorized hospital
        patient = patients_collection.find_one(
            {"patient_id": patient_id},
            {"_id": 0}
        )
    else:
        # Limited critical info for doctor / paramedic
        patient = patients_collection.find_one(
            {"patient_id": patient_id},
            {
                "_id": 0,
                "name": 1,
                "blood_group": 1,
                "allergies": 1,
                "chronic_conditions": 1
            }
        )

    # Determine actor (doctor/admin) from Authorization header when present
    actor_id = ""
    try:
        if authorization:
            # header may be 'Bearer <token>'
            parts = authorization.split()
            tok = parts[1] if len(parts) > 1 else parts[0]
            payload = decode_access_token(tok)
            actor_id = payload.get("doctor_id") or payload.get("admin_id") or ""
    except Exception:
        actor_id = ""

    # Audit log (include actor_id when available)
    log_emergency_access(patient_id, role, actor_id=actor_id)

    return {
        "patient_id": patient_id,
        "access_type": "full_record" if role == "hospital" else "critical_only",
        "emergency_data": patient
    }


# 3️⃣ Doctor Final Decision (accept / override AI) → persisted to MongoDB
@router.post("/doctor-decision")
def submit_doctor_decision(data: DoctorDecisionInput):
    entry = {
        "session_id": data.session_id,
        "decision": data.decision,
        "reason": data.reason,
        "severity": data.severity,
        "possible_condition": data.possible_condition,
        "timestamp": datetime.utcnow().isoformat()
    }
    doctor_decisions_collection.insert_one(entry)
    entry.pop("_id", None)  # remove Mongo ObjectId before returning
    return {"status": "saved", "entry": entry}


# 4️⃣ Doctor Notes → persisted to MongoDB
@router.post("/doctor-notes")
def submit_doctor_notes(data: DoctorNotesInput):
    entry = {
        "session_id": data.session_id,
        "notes": data.notes,
        "timestamp": datetime.utcnow().isoformat()
    }
    doctor_notes_collection.insert_one(entry)
    entry.pop("_id", None)
    return {"status": "saved", "entry": entry}


# 5️⃣ Emergency Access Logs
@router.get("/logs")
def get_emergency_logs(current: dict = Depends(get_current_doctor)):
    """Return emergency access audit logs for the currently authenticated doctor."""
    doctor_id = current.get("doctor_id")
    logs = get_logs_for_doctor(doctor_id)
    return {"logs": logs}


@router.get("/logs/{patient_id}")
def get_patient_emergency_logs(patient_id: str):
    """Return emergency access logs for a specific patient."""
    logs = get_logs_for_patient(patient_id)
    return {"patient_id": patient_id, "logs": logs}


# 6️⃣ Patient Emergency Timeline
@router.get("/timeline/{patient_id}")
def get_patient_timeline(patient_id: str):
    """Build a chronological timeline of all emergency events for a patient."""
    timeline = []

    # Emergency sessions (AI triages)
    sessions = list(emergency_sessions_collection.find(
        {"input_vitals.condition_text": {"$exists": True}},
        {"_id": 0}
    ).sort("timestamp", -1))

    # We need to match sessions by checking if patient context exists.
    # For now, return all sessions and filter by linked decisions.
    session_ids = [s["session_id"] for s in sessions]

    # Doctor decisions for these sessions
    decisions = list(doctor_decisions_collection.find(
        {"session_id": {"$in": session_ids}}, {"_id": 0}
    ))
    decision_map = {d["session_id"]: d for d in decisions}

    # Doctor notes for these sessions
    notes = list(doctor_notes_collection.find(
        {"session_id": {"$in": session_ids}}, {"_id": 0}
    ))
    notes_map = {n["session_id"]: n for n in notes}

    # Audit logs for this patient
    audit = get_logs_for_patient(patient_id)
    for log in audit:
        timeline.append({
            "type": "emergency_access",
            "timestamp": log.get("timestamp", ""),
            "detail": f"Emergency access by {log.get('role', 'unknown')}"
        })

    # Build session timeline entries
    for s in sessions:
        sid = s["session_id"]
        entry = {
            "type": "ai_triage",
            "timestamp": s.get("timestamp", ""),
            "session_id": sid,
            "severity": s.get("severity", ""),
            "possible_condition": s.get("possible_condition", ""),
            "vitals": s.get("input_vitals", {})
        }
        if sid in decision_map:
            entry["doctor_decision"] = decision_map[sid]
        if sid in notes_map:
            entry["doctor_notes"] = notes_map[sid].get("notes", "")
        timeline.append(entry)

    # Sort everything by timestamp descending
    timeline.sort(key=lambda x: x.get("timestamp", ""), reverse=True)

    return {"patient_id": patient_id, "timeline": timeline}


# 7️⃣ Emergency Patient View (consolidated emergency data)
@router.get("/patient-view/{patient_id}")
def emergency_patient_view(patient_id: str):
    """Consolidated emergency view: patient basics + medical passport + recent sessions."""
    patient = patients_collection.find_one(
        {"patient_id": patient_id}, {"_id": 0}
    )
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")

    # Recent emergency sessions
    recent_sessions = list(emergency_sessions_collection.find(
        {}, {"_id": 0}
    ).sort("timestamp", -1).limit(10))

    return {
        "patient_id": patient_id,
        "name": patient.get("name", ""),
        "age": patient.get("age", ""),
        "gender": patient.get("gender", ""),
        "blood_group": patient.get("blood_group", ""),
        "allergies": patient.get("allergies", []),
        "chronic_conditions": patient.get("chronic_conditions", []),
        "medications": patient.get("medications", []),
        "past_diagnoses": patient.get("past_diagnoses", []),
        "previous_emergencies": patient.get("previous_emergencies", []),
        "recent_sessions": recent_sessions
    }


# 8️⃣ Revoke hospital access early (before TTL expiry)
@router.delete("/revoke-access/{token}")
def revoke_hospital_access(token: str):
    """Manually revoke a hospital-scoped emergency token before it expires."""
    from app.services.database import emergency_tokens_collection

    deleted = emergency_tokens_collection.delete_one({"token": token, "role": "hospital"})
    if deleted.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Token not found or already expired")

    # Also mark the shared_access record as revoked
    shared_access_collection.update_one(
        {"hospital_token": token},
        {"$set": {"status": "revoked", "revoked_at": datetime.utcnow().isoformat()}}
    )

    return {"status": "revoked", "token": token, "note": "Hospital access has been revoked."}


# 9️⃣ Check shared-access status for a patient
@router.get("/shared-access/{patient_id}")
def get_shared_access(patient_id: str):
    """Return active and past auto-shared access records for a patient."""
    records = list(shared_access_collection.find(
        {"patient_id": patient_id}, {"_id": 0}
    ).sort("created_at", -1))

    # Mark expired records
    now = datetime.utcnow()
    for r in records:
        expires = r.get("expires_at")
        if expires and now > expires and r.get("status") == "active":
            r["status"] = "expired"

    return {"patient_id": patient_id, "shared_access_records": records}