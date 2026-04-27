from fastapi import APIRouter, HTTPException, Depends, File, UploadFile, Form
from fastapi.responses import StreamingResponse
import shutil
import os
from pydantic import BaseModel
from typing import Optional, List, Any
from datetime import datetime, timedelta
import uuid
from app.services.database import doctors_collection, doctor_hospital_associations_collection, hospital_admins_collection, patient_accounts_collection, patients_collection, consent_requests_collection, consent_collection, patient_notifications_collection, consultations_collection
from app.services.auth_service import (
    hash_password,
    verify_password,
    create_access_token,
    get_current_doctor,
)
from app.services.audit_service import log_emergency_access
from app.services.audit_service import get_logs_for_patient
from app.services.clinical_rules_service import get_patient_risk_and_summary
from app.models.hospital import HospitalSelectRequest
from app.services.patient_id_generator import generate_patient_id
from app.services.qr_service import generate_qr_code

router = APIRouter(prefix="/auth", tags=["Authentication"])



class DoctorSignup(BaseModel):
    name: str
    email: str
    password: str
    specialization: Optional[str] = "General Medicine"
    phone: Optional[str] = ""


class DoctorLogin(BaseModel):
    email: str
    password: str

class PatientProfileUpdate(BaseModel):
    blood_group: Optional[str] = None
    allergies: Optional[List[str]] = None
    chronic_conditions: Optional[List[str]] = None
    medications: Optional[List[str]] = None
    emergency_contact_name: Optional[str] = None
    emergency_contact_phone: Optional[str] = None

class PatientRecordUpload(BaseModel):
    record_type: str
    title: str
    description: str
    date: str

class PatientSignup(BaseModel):
    name: str
    email: str
    password: str
    age: Optional[int] = None
    dob: Optional[str] = None
    gender: Optional[str] = None
    blood_group: Optional[str] = None
    phone: Optional[str] = None
    emergency_contact: Optional[str] = None
    photo_url: Optional[str] = None


class PatientLogin(BaseModel):
    email: str
    password: str


class PatientPasswordChange(BaseModel):
    current_password: str
    new_password: str


class ConsentDecisionInput(BaseModel):
    request_id: str
    granted: bool
    duration_minutes: Optional[int] = 60
    note: Optional[str] = ""


class ConsentRevokeInput(BaseModel):
    consent_id: str
    reason: Optional[str] = "Revoked by patient"


@router.post("/signup")
def signup(data: DoctorSignup):
    # Self-registration is disabled. Doctors must be registered by their
    # hospital administrator via the Hospital Dashboard.
    raise HTTPException(
        status_code=403,
        detail="Doctor self-signup is disabled. Please ask your hospital admin to register you via /hospital/register-doctor"
    )


@router.post("/patient-signup")
def patient_signup(data: PatientSignup):
    existing = patient_accounts_collection.find_one({"email": data.email.strip().lower()})
    if existing:
        raise HTTPException(status_code=409, detail="Email already registered")

    patient_id = generate_patient_id()
    account = {
        "patient_id": patient_id,
        "name": data.name.strip(),
        "email": data.email.strip().lower(),
        "password": hash_password(data.password),
        "age": data.age,
        "dob": data.dob,
        "gender": data.gender,
        "blood_group": data.blood_group,
        "phone": data.phone,
        "emergency_contact": data.emergency_contact,
        "photo_url": data.photo_url,
        "created_at": datetime.utcnow().isoformat(),
    }
    patient_accounts_collection.insert_one(account)

    # Also create base medical profile
    patient_doc = {
        "patient_id": patient_id,
        "name": data.name.strip(),
        "age": data.age or 0,
        "gender": data.gender or "Not Specified",
        "blood_group": data.blood_group or "Unknown",
        "phone": data.phone or "",
        "emergency_contact": data.emergency_contact or "",
        "email": data.email.strip().lower(),
        "photo_url": data.photo_url,
        "emergency_contact_name": "",
        "emergency_contact_phone": "",
        "allergies": [],
        "chronic_conditions": [],
        "past_diagnoses": [],
        "medications": [],
        "created_at": datetime.utcnow().isoformat()
    }
    patients_collection.insert_one(patient_doc)

    return {
        "message": "User created",
        "patient_id": patient_id,
    }


@router.post("/patient-signup-multipart")
def patient_signup_multipart(
    name: str = Form(...),
    email: str = Form(...),
    password: str = Form(...),
    age: Optional[int] = Form(None),
    dob: Optional[str] = Form(None),
    gender: Optional[str] = Form(None),
    blood_group: Optional[str] = Form(None),
    phone: Optional[str] = Form(None),
    emergency_contact: Optional[str] = Form(None),
    photo: Optional[UploadFile] = File(None),
):
    normalized_email = email.strip().lower()
    existing = patient_accounts_collection.find_one({"email": normalized_email})
    if existing:
        raise HTTPException(status_code=409, detail="Email already registered")

    photo_url = None
    if photo and photo.filename:
        ext = photo.filename.rsplit(".", 1)[-1].lower() if "." in photo.filename else ""
        allowed_extensions = {"png", "jpg", "jpeg", "webp"}
        if ext not in allowed_extensions:
            raise HTTPException(
                status_code=400,
                detail="Only image files (png, jpg, jpeg, webp) are allowed for patient photo.",
            )

        safe_file = f"patient_photo_{uuid.uuid4().hex[:12]}.{ext}"
        os.makedirs("uploads", exist_ok=True)
        saved_path = os.path.join("uploads", safe_file)
        with open(saved_path, "wb") as buffer:
            shutil.copyfileobj(photo.file, buffer)
        photo_url = f"/uploads/{safe_file}"

    patient_id = generate_patient_id()
    account = {
        "patient_id": patient_id,
        "name": name.strip(),
        "email": normalized_email,
        "password": hash_password(password),
        "age": age,
        "dob": dob,
        "gender": gender,
        "blood_group": blood_group,
        "phone": phone,
        "emergency_contact": emergency_contact,
        "photo_url": photo_url,
        "created_at": datetime.utcnow().isoformat(),
    }
    patient_accounts_collection.insert_one(account)

    patient_doc = {
        "patient_id": patient_id,
        "name": name.strip(),
        "age": age or 0,
        "gender": gender or "Not Specified",
        "blood_group": blood_group or "Unknown",
        "phone": phone or "",
        "emergency_contact": emergency_contact or "",
        "email": normalized_email,
        "photo_url": photo_url,
        "emergency_contact_name": "",
        "emergency_contact_phone": "",
        "allergies": [],
        "chronic_conditions": [],
        "past_diagnoses": [],
        "medications": [],
        "created_at": datetime.utcnow().isoformat(),
    }
    patients_collection.insert_one(patient_doc)

    return {
        "message": "User created",
        "patient_id": patient_id,
    }


@router.post("/login")
def login(data: DoctorLogin):
    doctor = doctors_collection.find_one({"email": data.email})

    if not doctor:
        raise HTTPException(status_code=401, detail="Invalid email or password")

    if not verify_password(data.password, doctor["password"]):
        raise HTTPException(status_code=401, detail="Invalid email or password")

    doctor_id = doctor["doctor_id"]

    # Fetch active hospital associations for this doctor
    associations = list(
        doctor_hospital_associations_collection.find(
            {"doctor_id": doctor_id, "status": "active"}, {"_id": 0}
        )
    )

    # Also check legacy hospital_code on doctor document (backward compat)
    legacy_code = doctor.get("hospital_code", "")
    if legacy_code and not associations:
        # Auto-migrate: create an association record from legacy field
        admin = hospital_admins_collection.find_one({"hospital_code": legacy_code})
        assoc = {
            "association_id": f"ASSOC-{uuid.uuid4().hex[:8].upper()}",
            "doctor_id": doctor_id,
            "hospital_code": legacy_code,
            "hospital_name": admin["hospital_name"] if admin else legacy_code,
            "role": doctor.get("role_level", "doctor"),
            "department": doctor.get("department", ""),
            "status": "active",
            "assigned_by": "system-migration",
            "created_at": datetime.utcnow().isoformat(),
        }
        doctor_hospital_associations_collection.insert_one(assoc)
        assoc.pop("_id", None)
        associations = [assoc]

    # Enrich associations with hospital_name for display
    enriched_hospitals = []
    for a in associations:
        enriched_hospitals.append({
            "hospital_code": a["hospital_code"],
            "hospital_name": a.get("hospital_name", a["hospital_code"]),
            "role": a.get("role", "doctor"),
            "department": a.get("department", ""),
        })

    # If exactly one active hospital → auto-select it in the JWT
    auto_hospital_code = ""
    auto_hospital_name = ""
    if len(enriched_hospitals) == 1:
        auto_hospital_code = enriched_hospitals[0]["hospital_code"]
        auto_hospital_name = enriched_hospitals[0]["hospital_name"]

    # Build JWT payload
    token_data = {
        "doctor_id": doctor_id,
        "name": doctor["name"],
        "email": doctor["email"],
        "role": doctor.get("role", "doctor"),
        "hospital_code": auto_hospital_code,
        "hospital_name": auto_hospital_name,
    }

    access_token = create_access_token(token_data)

    return {
        "message": "Login successful",
        "access_token": access_token,
        "token_type": "bearer",
        "doctor": {
            "doctor_id": doctor_id,
            "name": doctor["name"],
            "email": doctor["email"],
            "specialization": doctor.get("specialization", ""),
            "phone": doctor.get("phone", ""),
            "role": doctor.get("role", "doctor"),
        },
        "hospitals": enriched_hospitals,
        "active_hospital": auto_hospital_code,
    }


@router.post("/patient-login")
def patient_login(data: PatientLogin):
    account = patient_accounts_collection.find_one({"email": data.email.strip().lower()})

    if not account:
        raise HTTPException(status_code=401, detail="Invalid email or password")

    if not verify_password(data.password, account["password"]):
        raise HTTPException(status_code=401, detail="Invalid email or password")

    token_data = {
        "patient_id": account["patient_id"],
        "name": account.get("name", ""),
        "email": account["email"],
        "role": "patient",
    }
    access_token = create_access_token(token_data)

    return {
        "message": "Login successful",
        "access_token": access_token,
        "token_type": "bearer",
        "patient": {
            "patient_id": account["patient_id"],
            "name": account.get("name", ""),
            "email": account["email"],
        },
    }


@router.get("/me")
def get_profile(current: dict = Depends(get_current_doctor)):
    """Return the currently authenticated doctor's profile.
    Requires Authorization: Bearer <token> header."""
    doctor = doctors_collection.find_one(
        {"doctor_id": current["doctor_id"]}, {"_id": 0, "password": 0}
    )
    if not doctor:
        raise HTTPException(status_code=404, detail="Doctor not found")

    # Include active hospital info from JWT
    doctor["active_hospital_code"] = current.get("hospital_code", "")
    doctor["active_hospital_name"] = current.get("hospital_name", "")
    return doctor


@router.post("/patient-me/records")
def upload_patient_record(
    record_type: str = Form(...),
    title: str = Form(...),
    description: str = Form(...),
    date: str = Form(...),
    file: Optional[UploadFile] = File(None),
    current: dict = Depends(get_current_doctor)
):
    patient_id = current.get("patient_id")
    if not patient_id:
        raise HTTPException(status_code=403, detail="Patient token required")

    category_aliases = {
        "lab reports": "lab_reports",
        "lab report": "lab_reports",
        "lab": "lab_reports",
        "prescriptions": "prescriptions",
        "prescription": "prescriptions",
        "rx": "prescriptions",
        "scan results": "scan_results",
        "scan result": "scan_results",
        "scan": "scan_results",
        "xray": "scan_results",
        "x-ray": "scan_results",
        "mri": "scan_results",
        "ct": "scan_results",
        "ultrasound": "scan_results",
        "surgical history": "surgical_history",
        "surgery": "surgical_history",
        "surgical": "surgical_history",
        "operation": "surgical_history",
    }
    normalized_type = category_aliases.get((record_type or "").strip().lower())
    if not normalized_type:
        raise HTTPException(
            status_code=400,
            detail=(
                "Invalid record_type. Allowed categories: "
                "Lab Reports, Prescriptions, Scan Results, Surgical History"
            ),
        )

    file_url = None
    if file and file.filename:
        file_extension = file.filename.split(".")[-1].lower()
        allowed_extensions = {"pdf", "png", "jpg", "jpeg", "webp"}
        if file_extension not in allowed_extensions:
            raise HTTPException(
                status_code=400,
                detail="Only PDF and image files (png, jpg, jpeg, webp) are allowed.",
            )
        file_name = f"{patient_id}_{uuid.uuid4().hex[:8]}.{file_extension}"
        os.makedirs("uploads", exist_ok=True)
        file_path = os.path.join("uploads", file_name)
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        file_url = f"/uploads/{file_name}"

    record_doc = {
        "record_id": f"REC-{uuid.uuid4().hex[:8].upper()}",
        "type": normalized_type,
        "title": title,
        "description": description,
        "date": date,
        "file_url": file_url,
        "uploaded_at": datetime.utcnow().isoformat()
    }

    patients_collection.update_one(
        {"patient_id": patient_id},
        {"$push": {"uploaded_records": record_doc}},
        upsert=True,
    )

    return {"message": "Record uploaded successfully", "record": record_doc}


@router.put("/patient-me")
def update_patient_profile(data: PatientProfileUpdate, current: dict = Depends(get_current_doctor)):
    patient_id = current.get("patient_id")
    if not patient_id:
        raise HTTPException(status_code=403, detail="Patient token required")

    update_fields = {k: v for k, v in data.dict(exclude_none=True).items()}
    
    if update_fields:
        patients_collection.update_one(
            {"patient_id": patient_id},
            {"$set": update_fields},
            upsert=True,
        )

    return {"message": "Profile updated successfully"}


@router.post("/patient-me/photo")
def update_patient_photo(
    photo: UploadFile = File(...),
    current: dict = Depends(get_current_doctor),
):
    patient_id = current.get("patient_id")
    if not patient_id:
        raise HTTPException(status_code=403, detail="Patient token required")

    if not photo or not photo.filename:
        raise HTTPException(status_code=400, detail="Photo file is required")

    ext = photo.filename.rsplit(".", 1)[-1].lower() if "." in photo.filename else ""
    allowed_extensions = {"png", "jpg", "jpeg", "webp"}
    if ext not in allowed_extensions:
        raise HTTPException(
            status_code=400,
            detail="Only image files (png, jpg, jpeg, webp) are allowed for profile photo.",
        )

    safe_file = f"patient_photo_{uuid.uuid4().hex[:12]}.{ext}"
    os.makedirs("uploads", exist_ok=True)
    saved_path = os.path.join("uploads", safe_file)
    with open(saved_path, "wb") as buffer:
        shutil.copyfileobj(photo.file, buffer)

    photo_url = f"/uploads/{safe_file}"

    patient_accounts_collection.update_one(
        {"patient_id": patient_id},
        {"$set": {"photo_url": photo_url}},
    )
    patients_collection.update_one(
        {"patient_id": patient_id},
        {"$set": {"photo_url": photo_url}},
        upsert=True,
    )

    return {
        "message": "Profile photo updated successfully",
        "photo_url": photo_url,
    }

@router.get("/patient-me")
def get_patient_profile(current: dict = Depends(get_current_doctor)):
    patient_id = current.get("patient_id")
    if not patient_id:
        raise HTTPException(status_code=403, detail="Patient token required")

    account = patient_accounts_collection.find_one(
        {"patient_id": patient_id},
        {"_id": 0, "password": 0},
    )
    if not account:
        raise HTTPException(status_code=404, detail="Patient account not found")

    medical_profile = patients_collection.find_one(
        {"patient_id": patient_id},
        {"_id": 0}
    )
    
    # Merge data
    if medical_profile:
        account.update({
            "blood_group": medical_profile.get("blood_group", ""),
            "allergies": medical_profile.get("allergies", []),
            "chronic_conditions": medical_profile.get("chronic_conditions", []),
            "medications": medical_profile.get("medications", []),
            "emergency_contact_name": medical_profile.get("emergency_contact_name", ""),
            "emergency_contact_phone": medical_profile.get("emergency_contact_phone", ""),
            "photo_url": account.get("photo_url") or medical_profile.get("photo_url") or medical_profile.get("profile_photo") or medical_profile.get("image_url") or "",
            "uploaded_records": medical_profile.get("uploaded_records", [])
        })

    return account


def _parse_datetime(value: Any) -> Optional[datetime]:
    if value is None:
        return None
    if isinstance(value, datetime):
        return value
    text = str(value).strip()
    if not text:
        return None
    try:
        return datetime.fromisoformat(text.replace("Z", "+00:00"))
    except Exception:
        return None


def _iso_or_empty(value: Any) -> str:
    parsed = _parse_datetime(value)
    if parsed is None:
        return str(value or "").strip()
    return parsed.isoformat()


def _safe_list(value: Any) -> List[Any]:
    if isinstance(value, list):
        return value
    if value is None:
        return []
    return [value]


@router.get("/patient-me/medical-summary")
def get_patient_medical_summary(current: dict = Depends(get_current_doctor)):
    patient_id = current.get("patient_id")
    if not patient_id:
        raise HTTPException(status_code=403, detail="Patient token required")

    account = patient_accounts_collection.find_one(
        {"patient_id": patient_id},
        {"_id": 0, "password": 0},
    )
    if not account:
        raise HTTPException(status_code=404, detail="Patient account not found")

    medical_profile = patients_collection.find_one({"patient_id": patient_id}, {"_id": 0}) or {}

    candidate_ids = list({
        patient_id,
        str(account.get("patient_id", "")).strip(),
        str(medical_profile.get("patient_id", "")).strip(),
    } - {""})

    consultations = list(
        consultations_collection.find(
            {"patient_id": {"$in": candidate_ids}},
            {"_id": 0},
        ).sort("timestamp", -1).limit(300)
    )

    now = datetime.utcnow()
    consultation_records = []
    active_prescriptions = []
    completed_prescriptions = []

    for consult in consultations:
        observation = consult.get("observation", {}) or {}
        condition = consult.get("condition", {}) or {}
        medication_request = consult.get("medication_request", {}) or {}
        follow_up = consult.get("follow_up", {}) or {}

        consultation_date = _iso_or_empty(consult.get("timestamp") or consult.get("created_at"))
        diagnosis = (condition.get("final_diagnosis") or condition.get("provisional_diagnosis") or "").strip()
        symptoms = [str(s).strip() for s in _safe_list(observation.get("symptoms")) if str(s).strip()]
        prescribed_medicines = [
            str(m).strip()
            for m in _safe_list(medication_request.get("medications_prescribed"))
            if str(m).strip()
        ]

        consultation_records.append({
            "consultation_id": consult.get("consultation_id", ""),
            "date": consultation_date,
            "doctor_name": consult.get("doctor_name", ""),
            "doctor_id": consult.get("doctor_id", ""),
            "hospital_name": consult.get("hospital_name", ""),
            "diagnosis": diagnosis,
            "symptoms": symptoms,
            "notes": (observation.get("clinical_observations") or "").strip(),
            "treatment_notes": (medication_request.get("treatment_plan") or "").strip(),
            "prescribed_medicines": prescribed_medicines,
            "advice": (follow_up.get("advice") or "").strip(),
        })

        detailed = medication_request.get("medications_prescribed_details")
        if isinstance(detailed, list) and detailed:
            source_items = detailed
        else:
            source_items = [
                {"name": med_name}
                for med_name in prescribed_medicines
            ]

        for item in source_items:
            if isinstance(item, dict):
                medicine_name = str(
                    item.get("name")
                    or item.get("medicine")
                    or item.get("medication")
                    or item.get("drug")
                    or ""
                ).strip()
                dose = str(item.get("dose") or item.get("dosage") or "").strip()
                frequency = str(item.get("frequency") or "").strip()
                instructions = str(item.get("instructions") or item.get("notes") or "").strip()
                duration_days_raw = item.get("duration_days")
                start_date_raw = item.get("start_date") or consultation_date
                end_date_raw = item.get("end_date")
            else:
                medicine_name = str(item).strip()
                dose = ""
                frequency = ""
                instructions = ""
                duration_days_raw = None
                start_date_raw = consultation_date
                end_date_raw = None

            if not medicine_name:
                continue

            try:
                duration_days = int(duration_days_raw) if duration_days_raw is not None else None
            except Exception:
                duration_days = None

            start_dt = _parse_datetime(start_date_raw)
            end_dt = _parse_datetime(end_date_raw)
            if end_dt is None and start_dt is not None and duration_days is not None and duration_days > 0:
                end_dt = start_dt + timedelta(days=duration_days)

            status = "active"
            if end_dt is not None and end_dt < now:
                status = "completed"

            normalized = {
                "consultation_id": consult.get("consultation_id", ""),
                "medicine_name": medicine_name,
                "dose": dose,
                "frequency": frequency,
                "instructions": instructions,
                "prescribed_date": consultation_date,
                "start_date": _iso_or_empty(start_dt) if start_dt else consultation_date,
                "end_date": _iso_or_empty(end_dt) if end_dt else "",
                "duration_days": duration_days,
                "prescribed_by": consult.get("doctor_name", ""),
                "doctor_id": consult.get("doctor_id", ""),
                "status": status,
            }

            if status == "completed":
                completed_prescriptions.append(normalized)
            else:
                active_prescriptions.append(normalized)

    active_prescriptions.sort(key=lambda x: x.get("prescribed_date", ""), reverse=True)
    completed_prescriptions.sort(key=lambda x: x.get("end_date", ""), reverse=True)

    uploaded_records = medical_profile.get("uploaded_records", []) or []
    grouped_uploaded = {
        "lab_reports": [],
        "prescriptions": [],
        "scans": [],
        "other_documents": [],
    }
    for rec in uploaded_records:
        rec_type = str(rec.get("type", "")).lower()
        if "lab" in rec_type:
            grouped_uploaded["lab_reports"].append(rec)
        elif "prescription" in rec_type or rec_type == "rx":
            grouped_uploaded["prescriptions"].append(rec)
        elif "scan" in rec_type or "xray" in rec_type or "mri" in rec_type or "ct" in rec_type:
            grouped_uploaded["scans"].append(rec)
        else:
            grouped_uploaded["other_documents"].append(rec)

    return {
        "patient_id": patient_id,
        "basic_medical_profile": {
            "blood_group": medical_profile.get("blood_group", ""),
            "allergies": medical_profile.get("allergies", []) or [],
            "chronic_conditions": medical_profile.get("chronic_conditions", []) or [],
            "regular_medications": medical_profile.get("medications", []) or [],
        },
        "doctor_consultation_records": consultation_records,
        "doctor_prescriptions": {
            "active_prescriptions": active_prescriptions,
            "completed_or_expired_prescriptions": completed_prescriptions,
        },
        "uploaded_medical_records": grouped_uploaded,
    }


@router.post("/patient-me/change-password")
def change_patient_password(data: PatientPasswordChange, current: dict = Depends(get_current_doctor)):
    patient_id = current.get("patient_id")
    if not patient_id:
        raise HTTPException(status_code=403, detail="Patient token required")

    account = patient_accounts_collection.find_one({"patient_id": patient_id})
    if not account:
        raise HTTPException(status_code=404, detail="Patient account not found")

    if not verify_password(data.current_password, account.get("password", "")):
        raise HTTPException(status_code=401, detail="Current password is incorrect")

    if len(data.new_password) < 6:
        raise HTTPException(status_code=400, detail="New password must be at least 6 characters")

    patient_accounts_collection.update_one(
        {"patient_id": patient_id},
        {"$set": {"password": hash_password(data.new_password)}},
    )

    return {"message": "Password changed successfully"}


@router.get("/patient-me/history-timeline")
def get_patient_history_timeline(current: dict = Depends(get_current_doctor)):
    patient_id = current.get("patient_id")
    if not patient_id:
        raise HTTPException(status_code=403, detail="Patient token required")

    account = patient_accounts_collection.find_one(
        {"patient_id": patient_id},
        {"_id": 0, "password": 0},
    )
    if not account:
        raise HTTPException(status_code=404, detail="Patient account not found")

    medical_profile = patients_collection.find_one(
        {"patient_id": patient_id},
        {"_id": 0}
    ) or {}

    timeline = []

    for item in medical_profile.get("past_diagnoses", []) or []:
        title = str(item)
        event_date = ""
        if "(" in title and title.endswith(")"):
            event_date = title[title.rfind("(") + 1:-1]
            title = title[:title.rfind("(")].strip()
        timeline.append({
            "category": "disease",
            "title": title or "Diagnosis",
            "details": str(item),
            "date": event_date,
            "source": "diagnosis_history",
        })

    for rec in medical_profile.get("uploaded_records", []) or []:
        rec_type = str(rec.get("type", "")).lower()
        category = "surgery" if "surgery" in rec_type else "record"
        timeline.append({
            "category": category,
            "title": rec.get("title", "Medical record"),
            "details": rec.get("description", ""),
            "date": rec.get("date", ""),
            "source": "uploaded_record",
        })

    meds = medical_profile.get("medications", []) or []
    for med in meds:
        timeline.append({
            "category": "medication",
            "title": str(med),
            "details": "Current medication",
            "date": medical_profile.get("records_updated_at", ""),
            "source": "current_medication",
        })

    timeline.sort(key=lambda x: x.get("date", ""), reverse=True)

    patient_context = dict(account)
    patient_context.update(medical_profile)
    ai_profile = get_patient_risk_and_summary(patient_context)

    return {
        "patient_id": patient_id,
        "timeline": timeline,
        "important_alerts": ai_profile.get("important_alerts", {}),
        "emergency_summary": ai_profile.get("emergency_summary", {}),
    }


@router.get("/patient-me/notifications")
def get_patient_notifications(current: dict = Depends(get_current_doctor)):
    patient_id = current.get("patient_id")
    if not patient_id:
        raise HTTPException(status_code=403, detail="Patient token required")

    notifications = list(
        patient_notifications_collection.find(
            {"patient_id": patient_id},
            {"_id": 0}
        ).sort("created_at", -1).limit(100)
    )

    return {
        "patient_id": patient_id,
        "notifications": notifications,
        "unread_count": len([n for n in notifications if not n.get("read", False)]),
    }


@router.post("/patient-me/notifications/{notification_id}/read")
def mark_patient_notification_read(notification_id: str, current: dict = Depends(get_current_doctor)):
    patient_id = current.get("patient_id")
    if not patient_id:
        raise HTTPException(status_code=403, detail="Patient token required")

    result = patient_notifications_collection.update_one(
        {"patient_id": patient_id, "notification_id": notification_id},
        {"$set": {"read": True, "read_at": datetime.utcnow().isoformat()}},
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Notification not found")

    return {"status": "read", "notification_id": notification_id}


@router.get("/patient-me/audit-logs")
def get_patient_audit_logs(current: dict = Depends(get_current_doctor)):
    patient_id = current.get("patient_id")
    if not patient_id:
        raise HTTPException(status_code=403, detail="Patient token required")

    logs = get_logs_for_patient(patient_id)
    return {
        "patient_id": patient_id,
        "logs": logs,
    }


@router.get("/patient-me/consent-requests")
def get_patient_consent_requests(current: dict = Depends(get_current_doctor)):
    patient_id = current.get("patient_id")
    if not patient_id:
        raise HTTPException(status_code=403, detail="Patient token required")

    # Get pending requests
    pending_requests = list(
        consent_requests_collection.find(
            {"patient_id": patient_id, "status": "requested"},
            {"_id": 0}
        ).sort("created_at", -1)
    )

    # Get granted consents
    granted_consents = list(
        consent_collection.find(
            {"patient_id": patient_id, "granted": True},
            {"_id": 0}
        ).sort("created_at", -1)
    )

    # Format timestamps
    for req in pending_requests:
        if req.get("created_at") and hasattr(req["created_at"], "isoformat"):
            req["created_at"] = req["created_at"].isoformat()

    for consent in granted_consents:
        if consent.get("created_at") and hasattr(consent["created_at"], "isoformat"):
            consent["created_at"] = consent["created_at"].isoformat()
        if consent.get("expires_at") and hasattr(consent["expires_at"], "isoformat"):
            consent["expires_at"] = consent["expires_at"].isoformat()

    return {
        "patient_id": patient_id,
        "requests": pending_requests,
        "granted_consents": granted_consents
    }


@router.post("/patient-me/consent-decision")
def decide_patient_consent(data: ConsentDecisionInput, current: dict = Depends(get_current_doctor)):
    patient_id = current.get("patient_id")
    if not patient_id:
        raise HTTPException(status_code=403, detail="Patient token required")

    req = consent_requests_collection.find_one(
        {"request_id": data.request_id, "patient_id": patient_id},
        {"_id": 0}
    )
    if not req:
        raise HTTPException(status_code=404, detail="Consent request not found")

    if req.get("status") != "requested":
        raise HTTPException(status_code=400, detail="Consent request already processed")

    now = datetime.utcnow()
    expires_at = None
    duration = data.duration_minutes if data.duration_minutes is not None else 60
    if data.granted and duration and int(duration) > 0:
        expires_at = now + timedelta(minutes=int(duration))

    consent_record = {
        "consent_id": f"CONS-{uuid.uuid4().hex[:8].upper()}",
        "patient_id": patient_id,
        "request_id": data.request_id,
        "granted": bool(data.granted),
        "granted_by": "patient",
        "requested_by": req.get("requested_by", ""),
        "hospital_code": req.get("hospital_code", ""),
        "hospital_name": req.get("hospital_name", ""),
        "note": data.note or "",
        "created_at": now,
        "expires_at": expires_at,
    }
    consent_collection.insert_one(consent_record)

    consent_requests_collection.update_one(
        {"request_id": data.request_id, "patient_id": patient_id},
        {
            "$set": {
                "status": "approved" if data.granted else "denied",
                "decision_note": data.note or "",
                "decided_at": now,
            }
        }
    )

    log_emergency_access(
        patient_id=patient_id,
        role="patient",
        mode="CONSENT_DECISION",
        detail=f"Consent {'approved' if data.granted else 'denied'} for request {data.request_id}",
        actor_id=patient_id,
        hospital_code=req.get("hospital_code", ""),
    )

    response = {k: v for k, v in consent_record.items() if k != "_id"}
    if response.get("created_at") and hasattr(response["created_at"], "isoformat"):
        response["created_at"] = response["created_at"].isoformat()
    if response.get("expires_at") and hasattr(response["expires_at"], "isoformat"):
        response["expires_at"] = response["expires_at"].isoformat()

    return {
        "status": "approved" if data.granted else "denied",
        "consent": response,
    }


@router.post("/patient-me/revoke-consent")
def revoke_patient_consent(data: ConsentRevokeInput, current: dict = Depends(get_current_doctor)):
    patient_id = current.get("patient_id")
    if not patient_id:
        raise HTTPException(status_code=403, detail="Patient token required")

    consent = consent_collection.find_one(
        {"consent_id": data.consent_id, "patient_id": patient_id, "granted": True},
        {"_id": 0}
    )
    if not consent:
        raise HTTPException(status_code=404, detail="Active consent not found")

    now = datetime.utcnow()

    # Update consent to revoked
    consent_collection.update_one(
        {"consent_id": data.consent_id, "patient_id": patient_id},
        {
            "$set": {
                "granted": False,
                "revoked_at": now,
                "revoke_reason": data.reason or "Revoked by patient",
            }
        }
    )

    log_emergency_access(
        patient_id=patient_id,
        role="patient",
        mode="CONSENT_REVOKE",
        detail=f"Consent revoked for {data.consent_id}: {data.reason or 'Revoked by patient'}",
        actor_id=patient_id,
        hospital_code=consent.get("hospital_code", ""),
    )

    return {
        "status": "revoked",
        "consent_id": data.consent_id,
        "revoked_at": now.isoformat(),
    }


@router.post("/select-hospital")
def select_hospital(data: HospitalSelectRequest, current: dict = Depends(get_current_doctor)):
    """Doctor selects which hospital to operate under for this session.

    Validates that the doctor has an active association with the chosen hospital,
    then returns a new JWT embedding the hospital_code and hospital_name.
    """
    doctor_id = current["doctor_id"]

    # Verify active association
    assoc = doctor_hospital_associations_collection.find_one({
        "doctor_id": doctor_id,
        "hospital_code": data.hospital_code,
        "status": "active",
    })
    if not assoc:
        raise HTTPException(
            status_code=403,
            detail="You do not have an active association with this hospital.",
        )

    hospital_name = assoc.get("hospital_name", data.hospital_code)

    # Issue new JWT with hospital context
    token_data = {
        "doctor_id": doctor_id,
        "name": current["name"],
        "email": current["email"],
        "role": current.get("role", "doctor"),
        "hospital_code": data.hospital_code,
        "hospital_name": hospital_name,
    }
    access_token = create_access_token(token_data)

    return {
        "message": f"Hospital set to {hospital_name}",
        "access_token": access_token,
        "token_type": "bearer",
        "active_hospital": data.hospital_code,
        "hospital_name": hospital_name,
    }


@router.get("/my-hospitals")
def list_my_hospitals(current: dict = Depends(get_current_doctor)):
    """Return all hospitals the current doctor is associated with."""
    doctor_id = current["doctor_id"]
    associations = list(
        doctor_hospital_associations_collection.find(
            {"doctor_id": doctor_id}, {"_id": 0}
        )
    )
    # Normalize datetime
    for a in associations:
        for key in ("created_at", "revoked_at"):
            val = a.get(key)
            if val and hasattr(val, "isoformat"):
                a[key] = val.isoformat()

    active = [a for a in associations if a.get("status") == "active"]
    revoked = [a for a in associations if a.get("status") != "active"]

    return {
        "doctor_id": doctor_id,
        "active_hospitals": active,
        "past_hospitals": revoked,
        "current_hospital": current.get("hospital_code", ""),
    }

@router.get("/patient-me/qr-code")
def get_patient_qr_code(current: dict = Depends(get_current_doctor)):
    patient_id = current.get("patient_id")
    if not patient_id:
        raise HTTPException(status_code=403, detail="Patient token required")

    # The QR code will contain the patient_id
    qr_data = patient_id
    qr_image_buffer = generate_qr_code(qr_data)

    return StreamingResponse(qr_image_buffer, media_type="image/png")
