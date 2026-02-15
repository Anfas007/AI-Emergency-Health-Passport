from datetime import datetime

audit_logs = []

def log_emergency_access(patient_id, role):
    audit_logs.append({
        "patient_id": patient_id,
        "role": role,
        "mode": "EMERGENCY",
        "timestamp": datetime.utcnow()
    })
