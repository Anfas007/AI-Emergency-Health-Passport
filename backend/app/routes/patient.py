from fastapi import APIRouter, HTTPException, Depends
from app.models.patient import Patient, MedicalRecordUpdate, ConsultationRecord
from app.services.database import (
    patients_collection, consultations_collection, patient_notifications_collection,
    consent_collection, patient_accounts_collection, consent_requests_collection
)
from app.services.patient_id_generator import generate_patient_id
from app.services.audit_service import log_emergency_access
from datetime import datetime, timedelta
from app.services.auth_service import get_current_doctor, get_current_doctor_with_hospital
from app.services.clinical_rules_service import get_patient_risk_and_summary, get_drug_interaction_warnings
import uuid

router = APIRouter(prefix="/patients", tags=["Patients"])


def _get_active_consent(patient_id: str):
    consent = consent_collection.find_one(
        {"patient_id": patient_id, "granted": True},
        sort=[("created_at", -1)]
    )
    if not consent:
        return None
    expires_at = consent.get("expires_at")
    if expires_at and expires_at < datetime.utcnow():
        return None
    return consent


def _normalize_patient_id(patient_id: str) -> str:
    """Map legacy patient identifiers to canonical patient_accounts.patient_id when possible."""
    pid = (patient_id or "").strip()
    if not pid:
        return pid

    # Already canonical
    account = patient_accounts_collection.find_one({"patient_id": pid}, {"_id": 0, "patient_id": 1})
    if account:
        return pid

    # Legacy patient record may carry different patient_id but same email
    patient = patients_collection.find_one({"patient_id": pid}, {"_id": 0, "email": 1})
    email = (patient or {}).get("email", "").strip().lower()
    if email:
        mapped = patient_accounts_collection.find_one({"email": email}, {"_id": 0, "patient_id": 1})
        if mapped:
            return mapped["patient_id"]

    return pid


def _get_active_consent_for_ids(patient_ids: list[str]):
    """Return the first active consent found across candidate patient IDs."""
    for pid in patient_ids:
        consent = _get_active_consent(pid)
        if consent:
            return consent
    return None


def _build_patient_lookup_context(patient_id: str):
    """Resolve mixed legacy/canonical identifiers into lookup candidates and a patient document."""
    raw_pid = (patient_id or "").strip()
    canonical_pid = _normalize_patient_id(raw_pid)

    candidate_ids = []
    for pid in [raw_pid, canonical_pid]:
        if pid and pid not in candidate_ids:
            candidate_ids.append(pid)

    account = patient_accounts_collection.find_one(
        {"patient_id": canonical_pid},
        {"_id": 0, "email": 1}
    ) if canonical_pid else None
    email = ((account or {}).get("email") or "").strip().lower()

    if email:
        linked_profiles = list(
            patients_collection.find(
                {"email": email},
                {"_id": 0, "patient_id": 1}
            )
        )
        for profile in linked_profiles:
            linked_pid = (profile.get("patient_id") or "").strip()
            if linked_pid and linked_pid not in candidate_ids:
                candidate_ids.append(linked_pid)

    patient = None
    if candidate_ids:
        patient = patients_collection.find_one(
            {"patient_id": {"$in": candidate_ids}},
            {"_id": 0}
        )
    if not patient and email:
        patient = patients_collection.find_one({"email": email}, {"_id": 0})

    resolved_pid = (patient or {}).get("patient_id") or canonical_pid or raw_pid
    if resolved_pid and resolved_pid not in candidate_ids:
        candidate_ids.append(resolved_pid)

    return {
        "raw_pid": raw_pid,
        "canonical_pid": canonical_pid,
        "resolved_pid": resolved_pid,
        "candidate_ids": candidate_ids,
        "patient": patient,
        "email": email,
    }


def _ensure_pending_consent_request(patient_id: str, current: dict, reason: str = ""):
    """Create one pending consent request for this doctor+patient pair if absent."""
    pid = _normalize_patient_id(patient_id)
    doctor_id = current.get("doctor_id", "")

    if not pid or not doctor_id:
        return None, False

    account_exists = patient_accounts_collection.find_one({"patient_id": pid}, {"_id": 1})
    if not account_exists:
        return None, False

    existing = consent_requests_collection.find_one(
        {
            "patient_id": pid,
            "requested_by": doctor_id,
            "status": "requested",
        },
        {"_id": 0},
        sort=[("created_at", -1)],
    )
    if existing:
        return existing, False

    req = {
        "request_id": f"CREQ-{uuid.uuid4().hex[:8].upper()}",
        "patient_id": pid,
        "requested_by": doctor_id,
        "hospital_code": current.get("hospital_code", ""),
        "hospital_name": current.get("hospital_name", ""),
        "status": "requested",
        "created_at": datetime.utcnow(),
    }
    consent_requests_collection.insert_one(req)

    reason_text = f" Reason: {reason}" if reason else ""
    patient_notifications_collection.insert_one({
        "notification_id": f"N-{uuid.uuid4().hex[:8].upper()}",
        "patient_id": pid,
        "type": "consent_request",
        "message": (
            f"Dr. {current.get('name', 'Doctor')} requested consent for normal consultation"
            f" ({req['request_id']}): {reason}.{reason_text}"
        ).strip(),
        "request_id": req["request_id"],
        "hospital_code": current.get("hospital_code", ""),
        "hospital_name": current.get("hospital_name", ""),
        "read": False,
        "created_at": datetime.utcnow().isoformat(),
    })

    return req, True

@router.post("/register")
def register_patient(patient: Patient):
    patient_id = generate_patient_id()

    patient_dict = patient.dict()
    patient_dict["patient_id"] = patient_id

    patients_collection.insert_one(patient_dict)

    return {
        "message": "Patient registered successfully",
        "patient_id": patient_id
    }


@router.get("/history/{patient_id}")
def get_patient_history(patient_id: str, current: dict = Depends(get_current_doctor)):
    """Fetch full medical history for a patient."""
    patient = patients_collection.find_one(
        {"patient_id": patient_id},
        {"_id": 0}
    )
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")

    consent = _get_active_consent(patient_id)
    if not consent:
        _ensure_pending_consent_request(
            patient_id,
            current,
            reason="Normal history access was blocked until you approve.",
        )
        log_emergency_access(
            patient_id=patient_id,
            role="doctor",
            mode="CONSENT_BLOCKED",
            detail="Normal history access denied: consent missing/expired",
            actor_id=current.get("doctor_id", ""),
            hospital_code=current.get("hospital_code", ""),
            actor_name=current.get("name", ""),
        )
        raise HTTPException(
            status_code=403,
            detail="Patient consent is required for normal consultation access."
        )

    log_emergency_access(
        patient_id=patient_id,
        role="doctor",
        mode="NORMAL_CONSULTATION",
        detail="Normal history access allowed by consent",
        actor_id=current.get("doctor_id", ""),
        hospital_code=current.get("hospital_code", ""),
        actor_name=current.get("name", ""),
    )

    ai_profile = get_patient_risk_and_summary(patient)

    return {
        "patient_id": patient_id,
        "name": patient.get("name", ""),
        "blood_group": patient.get("blood_group", ""),
        "past_diagnoses": patient.get("past_diagnoses", []),
        "medications": patient.get("medications", []),
        "allergies": patient.get("allergies", []),
        "chronic_conditions": patient.get("chronic_conditions", []),
        "previous_emergencies": patient.get("previous_emergencies", []),
        "important_alerts": ai_profile.get("important_alerts", {}),
        "emergency_summary": ai_profile.get("emergency_summary", {}),
    }


@router.put("/records/{patient_id}")
def update_medical_records(patient_id: str, data: MedicalRecordUpdate, current: dict = Depends(get_current_doctor)):
    """Add or update verified medical records for a patient.
    Requires active patient consent."""
    patient = patients_collection.find_one({"patient_id": patient_id})
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")

    # ── Consent check ──
    from app.services.database import consent_collection
    consent = consent_collection.find_one(
        {"patient_id": patient_id, "granted": True},
        sort=[("created_at", -1)]
    )
    if not consent:
        raise HTTPException(
            status_code=403,
            detail="Patient consent is required before modifying records. Please request consent first."
        )
    # Check expiry
    if consent.get("expires_at") and consent["expires_at"] < datetime.utcnow():
        raise HTTPException(
            status_code=403,
            detail="Patient consent has expired. Please request new consent."
        )

    # Build $set update: only include fields the doctor actually sent
    update_fields = {}
    for field in ["past_diagnoses", "medications", "allergies",
                  "chronic_conditions", "previous_emergencies", "blood_group"]:
        value = getattr(data, field, None)
        if value is not None:
            update_fields[field] = value

    if not update_fields:
        raise HTTPException(status_code=400, detail="No fields to update")

    update_fields["records_updated_at"] = datetime.utcnow().isoformat()

    patients_collection.update_one(
        {"patient_id": patient_id},
        {"$set": update_fields}
    )

    return {
        "status": "updated",
        "patient_id": patient_id,
        "updated_fields": list(update_fields.keys())
    }


@router.get("/request-access/{patient_id}")
def request_normal_access(patient_id: str, current: dict = Depends(get_current_doctor)):
    """Normal (non-emergency) access: returns limited patient summary."""
    lookup = _build_patient_lookup_context(patient_id)
    pid = lookup["resolved_pid"]
    patient = lookup["patient"] or {}

    # Allow normal consultation bootstrap from patient account even if medical profile doc is missing.
    if not patient:
        account = patient_accounts_collection.find_one(
            {"patient_id": pid},
            {"_id": 0, "patient_id": 1, "name": 1, "age": 1, "gender": 1, "email": 1}
        )
        if not account:
            raise HTTPException(status_code=404, detail="Patient not found")
        patient = {
            "patient_id": account.get("patient_id", pid),
            "name": account.get("name", ""),
            "age": account.get("age", ""),
            "gender": account.get("gender", ""),
            "email": account.get("email", ""),
            "blood_group": "",
            "allergies": [],
            "chronic_conditions": [],
            "medications": [],
        }
        pid = patient.get("patient_id", pid)
        if pid not in lookup["candidate_ids"]:
            lookup["candidate_ids"].append(pid)

    consent = _get_active_consent_for_ids(lookup["candidate_ids"])
    if not consent:
        _ensure_pending_consent_request(
            lookup["canonical_pid"] or pid,
            current,
            reason="Normal access was blocked until you approve.",
        )
        log_emergency_access(
            patient_id=pid,
            role="doctor",
            mode="CONSENT_BLOCKED",
            detail="Normal access denied: consent missing/expired",
            actor_id=current.get("doctor_id", ""),
            hospital_code=current.get("hospital_code", ""),
            actor_name=current.get("name", ""),
        )
        raise HTTPException(
            status_code=403,
            detail="Patient consent is required. Request consent from the patient first."
        )

    log_emergency_access(
        patient_id=pid,
        role="doctor",
        mode="NORMAL_CONSULTATION",
        detail="Normal access allowed by consent",
        actor_id=current.get("doctor_id", ""),
        hospital_code=current.get("hospital_code", ""),
        actor_name=current.get("name", ""),
    )

    # Notify patient that a doctor accessed normal consultation data.
    patient_notifications_collection.insert_one({
        "notification_id": f"NOTIF-{uuid.uuid4().hex[:8].upper()}",
        "patient_id": pid,
        "doctor_id": current.get("doctor_id", ""),
        "doctor_name": current.get("name", ""),
        "hospital_code": current.get("hospital_code", ""),
        "type": "doctor_access",
        "message": f"Dr. {current.get('name', 'Doctor')} accessed your records for normal consultation.",
        "created_at": datetime.utcnow().isoformat(),
        "read": False,
    })

    ai_profile = get_patient_risk_and_summary(patient)

    return {
        "patient_id": pid,
        "name": patient.get("name", ""),
        "age": patient.get("age", ""),
        "gender": patient.get("gender", ""),
        "blood_group": patient.get("blood_group", ""),
        "allergies": patient.get("allergies", []),
        "chronic_conditions": patient.get("chronic_conditions", []),
        "medications": patient.get("medications", []),
        "access_type": "normal",
        "important_alerts": ai_profile.get("important_alerts", {}),
        "emergency_summary": ai_profile.get("emergency_summary", {}),
    }


@router.get("/consent/{patient_id}")
def get_consent_status(patient_id: str):
    """Return the current patient consent status (if any)."""
    from app.services.database import consent_collection

    rec = consent_collection.find_one({"patient_id": patient_id}, {"_id": 0}, sort=[("created_at", -1)])
    if not rec:
        return {"patient_id": patient_id, "consent": {"granted": False}}

    # Normalize datetime to isoformat when present
    if rec.get("expires_at") and hasattr(rec.get("expires_at"), "isoformat"):
        rec["expires_at"] = rec["expires_at"].isoformat()

    return {"patient_id": patient_id, "consent": rec}


@router.post("/request-consent/{patient_id}")
def request_additional_consent(patient_id: str, current: dict = Depends(get_current_doctor)):
    """Doctor requests additional normal-access consent for a patient.

    Creates a consent request record for review by the patient.
    """
    req, created = _ensure_pending_consent_request(
        patient_id,
        current,
    )

    if not req:
        raise HTTPException(status_code=404, detail="Patient not found for consent request")

    response_req = {k: v for k, v in req.items() if k != "_id"}

    if response_req.get("created_at") and hasattr(response_req["created_at"], "isoformat"):
        response_req["created_at"] = response_req["created_at"].isoformat()

    return {"status": "requested" if created else "already_requested", "request": response_req}



@router.post("/grant-consent/{patient_id}")
def grant_consent_by_patient(patient_id: str, payload: dict):
    """Public endpoint to allow a patient (or patient-facing system) to grant consent.

    NOTE: This endpoint is intentionally permissive because the patient-facing
    module is not yet implemented. In production this should be protected and
    require proper patient authentication or a signed consent token.
    Body: { granted: bool, duration_minutes?: int, granted_by?: str, note?: str }
    """
    from app.services.database import consent_collection

    granted = bool(payload.get("granted", True))
    duration = payload.get("duration_minutes", 60)
    granted_by = payload.get("granted_by", "patient")
    note = payload.get("note", "")

    expires_at = None
    if duration and isinstance(duration, int) and duration > 0:
        expires_at = datetime.utcnow() + timedelta(minutes=int(duration))

    consent_record = {
        "consent_id": f"CONS-{uuid.uuid4().hex[:8].upper()}",
        "patient_id": patient_id,
        "granted": granted,
        "granted_by": granted_by,
        "note": note,
        "created_at": datetime.utcnow(),
        "expires_at": expires_at,
    }

    consent_collection.insert_one(consent_record)

    # Return normalized response
    resp = {k: v for k, v in consent_record.items() if k != "_id"}
    if resp.get("expires_at") and hasattr(resp.get("expires_at"), "isoformat"):
        resp["expires_at"] = resp["expires_at"].isoformat()

    return {"status": "granted" if granted else "revoked", "consent": resp}


# ════════════════════════════════════════════════════════════════
#  Normal Consultation endpoints
# ════════════════════════════════════════════════════════════════

@router.post("/consultation")
def save_consultation(record: ConsultationRecord, current: dict = Depends(get_current_doctor)):
    """Save a full normal consultation as a FHIR-style structured record."""
    # Verify patient exists
    patient = patients_collection.find_one({"patient_id": record.patient_id})
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")

    consent = _get_active_consent(record.patient_id)
    if not consent:
        _ensure_pending_consent_request(
            record.patient_id,
            current,
            reason="Saving consultation was blocked until you approve.",
        )
        log_emergency_access(
            patient_id=record.patient_id,
            role="doctor",
            mode="CONSENT_BLOCKED",
            detail="Save consultation denied: consent missing/expired",
            actor_id=current.get("doctor_id", ""),
            hospital_code=current.get("hospital_code", ""),
            actor_name=current.get("name", ""),
        )
        raise HTTPException(
            status_code=403,
            detail="Patient consent is required before saving normal consultation."
        )

    doctor_id = current.get("doctor_id", "")
    doctor_name = current.get("name", "")
    hospital_code = current.get("hospital_code", "")
    hospital_name = current.get("hospital_name", "")
    consultation_id = f"CONS-{uuid.uuid4().hex[:8].upper()}"
    now = datetime.utcnow()

    interaction_warning = get_drug_interaction_warnings(
        patient,
        record.medications_prescribed or []
    )

    # Build FHIR-style structured entry
    fhir_entry = {
        "consultation_id": consultation_id,
        "patient_id": record.patient_id,
        "doctor_id": doctor_id,
        "doctor_name": doctor_name,
        "hospital_code": hospital_code,
        "hospital_name": hospital_name,
        "timestamp": now.isoformat(),
        # FHIR Observation
        "observation": {
            "chief_complaint": record.chief_complaint or "",
            "reason_for_visit": record.reason_for_visit or "",
            "symptoms": record.symptoms or [],
            "clinical_observations": record.clinical_observations or "",
            "vitals": {
                "heart_rate": record.heart_rate,
                "blood_pressure": record.blood_pressure,
                "temperature": record.temperature,
                "spo2": record.spo2,
                "respiratory_rate": record.respiratory_rate,
                "weight": record.weight,
            },
        },
        # FHIR Condition
        "condition": {
            "provisional_diagnosis": record.provisional_diagnosis or "",
            "final_diagnosis": record.final_diagnosis or "",
        },
        # FHIR MedicationRequest
        "medication_request": {
            "medications_prescribed": record.medications_prescribed or [],
            "medications_prescribed_details": record.medications_prescribed_details or [],
            "treatment_plan": record.treatment_plan or "",
        },
        # Follow-up
        "follow_up": {
            "advice": record.follow_up_advice or "",
            "date": record.follow_up_date or "",
        },
        # Metadata
        "doctor_signature": f"Dr. {doctor_name} (ID: {doctor_id})",
        "created_at": now,
    }

    consultations_collection.insert_one(fhir_entry)

    # Also push diagnosis into patient record if final diagnosis provided
    if record.final_diagnosis:
        patients_collection.update_one(
            {"patient_id": record.patient_id},
            {"$push": {"past_diagnoses": f"{record.final_diagnosis} ({now.strftime('%Y-%m-%d')})"},
             "$set": {"records_updated_at": now.isoformat()}}
        )

    # Do not overwrite patient-managed regular medications with consultation prescriptions.

    # Audit log
    log_emergency_access(
        patient_id=record.patient_id,
        role="doctor",
        mode="NORMAL_CONSULTATION",
        detail=f"Consultation {consultation_id} saved by Dr. {doctor_name} at {hospital_name or 'unspecified'}",
        actor_id=doctor_id,
        hospital_code=hospital_code,
        actor_name=doctor_name,
    )

    return {
        "status": "saved",
        "consultation_id": consultation_id,
        "patient_id": record.patient_id,
        "hospital_code": hospital_code,
        "timestamp": now.isoformat(),
        "drug_interaction_warning": interaction_warning,
    }


@router.get("/consultations/{patient_id}")
def get_consultations(patient_id: str, current: dict = Depends(get_current_doctor)):
    """Return all consultation records for a patient (most recent first)."""
    lookup = _build_patient_lookup_context(patient_id)
    pid = lookup["resolved_pid"]
    consent = _get_active_consent_for_ids(lookup["candidate_ids"])
    if not consent:
        _ensure_pending_consent_request(
            lookup["canonical_pid"] or pid,
            current,
            reason="Viewing consultation history was blocked until you approve.",
        )
        log_emergency_access(
            patient_id=pid,
            role="doctor",
            mode="CONSENT_BLOCKED",
            detail="Consultation history denied: consent missing/expired",
            actor_id=current.get("doctor_id", ""),
            hospital_code=current.get("hospital_code", ""),
            actor_name=current.get("name", ""),
        )
        raise HTTPException(
            status_code=403,
            detail="Patient consent is required before viewing consultation history."
        )

    records = list(
        consultations_collection.find(
            {"patient_id": {"$in": lookup["candidate_ids"]}}, {"_id": 0}
        ).sort("timestamp", -1).limit(50)
    )
    # Normalize datetime objects
    for r in records:
        if r.get("created_at") and hasattr(r["created_at"], "isoformat"):
            r["created_at"] = r["created_at"].isoformat()

    # Audit log
    doctor_id = current.get("doctor_id", "")
    log_emergency_access(
        patient_id=pid,
        role="doctor",
        mode="NORMAL_CONSULTATION",
        detail=f"Viewed consultation history ({len(records)} records)",
        actor_id=doctor_id,
        hospital_code=current.get("hospital_code", ""),
        actor_name=current.get("name", ""),
    )

    return {"patient_id": pid, "consultations": records}


@router.get("/medical-history/{patient_id}")
def get_medical_history(patient_id: str, current: dict = Depends(get_current_doctor)):
    """Return patient's uploaded medical history records."""
    lookup = _build_patient_lookup_context(patient_id)
    pid = lookup["resolved_pid"]
    consent = _get_active_consent_for_ids(lookup["candidate_ids"])
    if not consent:
        _ensure_pending_consent_request(
            lookup["canonical_pid"] or pid,
            current,
            reason="Viewing medical history was blocked until you approve.",
        )
        log_emergency_access(
            patient_id=pid,
            role="doctor",
            mode="CONSENT_BLOCKED",
            detail="Medical history denied: consent missing/expired",
            actor_id=current.get("doctor_id", ""),
            hospital_code=current.get("hospital_code", ""),
            actor_name=current.get("name", ""),
        )
        raise HTTPException(
            status_code=403,
            detail="Patient consent is required before viewing medical history."
        )

    patient = lookup["patient"] or {}
    if not patient:
        return {
            "patient_id": pid,
            "medical_history": {
                "past_diagnoses": [],
                "surgeries": [],
                "medications": [],
                "uploaded_records": [],
                "previous_emergencies": [],
            },
        }

    uploaded_records = patient.get("uploaded_records", []) or []
    surgeries = [
        r for r in uploaded_records
        if str(r.get("type", "")).lower() == "surgery"
    ]
    medical_history = {
        "past_diagnoses": patient.get("past_diagnoses", []) or [],
        "surgeries": surgeries,
        "medications": patient.get("medications", []) or [],
        "uploaded_records": uploaded_records,
        "previous_emergencies": patient.get("previous_emergencies", []) or [],
    }

    # Audit log
    doctor_id = current.get("doctor_id", "")
    log_emergency_access(
        patient_id=pid,
        role="doctor",
        mode="NORMAL_CONSULTATION",
        detail="Viewed patient medical history",
        actor_id=doctor_id,
        hospital_code=current.get("hospital_code", ""),
        actor_name=current.get("name", ""),
    )

    return {"patient_id": pid, "medical_history": medical_history}


@router.post("/notify/{patient_id}")
def notify_patient(patient_id: str, payload: dict, current: dict = Depends(get_current_doctor)):
    """Create a notification record for the patient about new record access.

    In production this would trigger push/SMS/email via a notification service.
    For now it persists the notification for the patient-facing module to pick up.

    Body: { consultation_id: str, message?: str }
    """
    patient = patients_collection.find_one({"patient_id": patient_id})
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")

    doctor_id = current.get("doctor_id", "")
    doctor_name = current.get("name", "")

    notification = {
        "notification_id": f"NOTIF-{uuid.uuid4().hex[:8].upper()}",
        "patient_id": patient_id,
        "doctor_id": doctor_id,
        "doctor_name": doctor_name,
        "consultation_id": payload.get("consultation_id", ""),
        "message": payload.get("message", f"Dr. {doctor_name} has added a new consultation record."),
        "status": "sent",
        "created_at": datetime.utcnow().isoformat(),
        "read": False,
        "actions_available": ["view", "download", "revoke_access"],
    }

    patient_notifications_collection.insert_one(notification)

    # Audit
    log_emergency_access(
        patient_id=patient_id,
        role="doctor",
        mode="NOTIFICATION",
        detail=f"Patient notified about consultation {payload.get('consultation_id', '')}",
        actor_id=doctor_id,
        hospital_code=current.get("hospital_code", ""),
        actor_name=doctor_name,
    )

    return {"status": "sent", "notification": {k: v for k, v in notification.items() if k != "_id"}}
