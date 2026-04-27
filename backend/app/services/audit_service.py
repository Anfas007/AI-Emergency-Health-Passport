from datetime import datetime
from app.services.database import audit_logs_collection


def log_emergency_access(
    patient_id,
    role,
    mode="EMERGENCY",
    detail="",
    actor_id: str = "",
    hospital_code: str = "",
    actor_name: str = "",
):
    entry = {
        "patient_id": patient_id,
        "role": role,
        "mode": mode,
        "detail": detail,
        "actor_id": actor_id,
        "doctor_id": actor_id,
        "doctor_name": actor_name,
        "hospital_code": hospital_code,
        "timestamp": datetime.utcnow().isoformat()
    }
    audit_logs_collection.insert_one(entry)


def get_all_logs(limit=100):
    """Return the most recent emergency access audit logs."""
    logs = list(
        audit_logs_collection.find({"mode": {"$ne": "CONSENT_DECISION"}}, {"_id": 0})
        .sort("timestamp", -1)
        .limit(limit)
    )
    return logs


def get_logs_for_doctor(doctor_id: str, limit: int = 200):
    """Return audit logs where the actor_id matches the given doctor_id."""
    if not doctor_id:
        return []
    logs = list(
        audit_logs_collection.find(
            {"actor_id": doctor_id, "mode": {"$ne": "CONSENT_DECISION"}}, {"_id": 0}
        ).sort("timestamp", -1).limit(limit)
    )
    return logs


def get_logs_for_patient(patient_id):
    """Return audit logs for a specific patient."""
    logs = list(
        audit_logs_collection.find(
            {"patient_id": patient_id, "mode": {"$ne": "CONSENT_DECISION"}}, {"_id": 0}
        ).sort("timestamp", -1)
    )
    return logs
