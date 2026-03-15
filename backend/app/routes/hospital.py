"""
Hospital Dashboard API — Control & Governance
───────────────────────────────────────────────
Endpoints:
  POST   /hospital/signup              – Register hospital admin
  POST   /hospital/login               – Hospital admin login
  GET    /hospital/profile              – Get current admin profile

  POST   /hospital/departments          – Create department
  GET    /hospital/departments          – List all departments
  PUT    /hospital/departments/{name}   – Update department
  DELETE /hospital/departments/{name}   – Delete department

  POST   /hospital/register-doctor      – Register a new doctor under hospital
  PUT    /hospital/verify-doctor        – Verify doctor & assign role / dept
  GET    /hospital/doctors              – List all doctors (with status)
  GET    /hospital/doctors/{doctor_id}  – Get single doctor detail

  GET    /hospital/record-access        – Monitor who accessed what records
  GET    /hospital/audit-logs           – View full audit trail

  POST   /hospital/compliance-report    – Generate compliance & summary report
"""

from fastapi import APIRouter, HTTPException, Depends
from datetime import datetime
import uuid

from app.models.hospital import (
    HospitalAdmin, HospitalLogin,
    DepartmentCreate, DoctorVerification,
    ComplianceReportRequest,
    DoctorAssignRequest, DoctorTransferRequest,
)
from app.services.database import (
    hospital_admins_collection, departments_collection,
    doctors_collection, audit_logs_collection,
    shared_access_collection, emergency_sessions_collection,
    patients_collection, doctor_hospital_associations_collection,
    consent_collection, consultations_collection,
)
from app.services.auth_service import (
    hash_password, verify_password,
    create_access_token, decode_access_token,
)
from app.services.audit_service import log_emergency_access
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi import Security

router = APIRouter(prefix="/hospital", tags=["Hospital Dashboard"])

security_scheme = HTTPBearer()


# ── Helper: get current hospital admin from JWT ──

def get_current_admin(
    credentials: HTTPAuthorizationCredentials = Security(security_scheme),
) -> dict:
    payload = decode_access_token(credentials.credentials)
    if payload.get("role") != "hospital_admin":
        raise HTTPException(status_code=403, detail="Hospital admin access required")
    return payload


# ═══════════════════════════════════════════════
# 1️⃣  HOSPITAL ADMIN AUTH
# ═══════════════════════════════════════════════

@router.post("/signup")
def hospital_signup(data: HospitalAdmin):
    """Register a new hospital administrator account."""
    existing = hospital_admins_collection.find_one({"email": data.email})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")

    if len(data.password) < 6:
        raise HTTPException(
            status_code=400, detail="Password must be at least 6 characters"
        )

    from app.services.patient_id_generator import generate_hospital_code
    admin_id = f"HADM-{uuid.uuid4().hex[:8].upper()}"
    hospital_code = data.hospital_code or generate_hospital_code()

    admin = {
        "admin_id": admin_id,
        "name": data.name,
        "email": data.email,
        "password": hash_password(data.password),
        "hospital_name": data.hospital_name,
        "hospital_code": hospital_code,
        "phone": data.phone,
        "role": "hospital_admin",
        "created_at": datetime.utcnow().isoformat(),
    }
    hospital_admins_collection.insert_one(admin)

    return {
        "message": "Hospital admin registered successfully",
        "admin_id": admin_id,
        "hospital_name": data.hospital_name,
        "hospital_code": hospital_code,
    }


@router.post("/login")
def hospital_login(data: HospitalLogin):
    """Hospital admin login → returns JWT."""
    admin = hospital_admins_collection.find_one({"email": data.email})
    if not admin:
        raise HTTPException(status_code=401, detail="Invalid email or password")

    if not verify_password(data.password, admin["password"]):
        raise HTTPException(status_code=401, detail="Invalid email or password")

    token_data = {
        "admin_id": admin["admin_id"],
        "name": admin["name"],
        "email": admin["email"],
        "hospital_name": admin["hospital_name"],
        "hospital_code": admin["hospital_code"],
        "role": "hospital_admin",
    }
    access_token = create_access_token(token_data)

    return {
        "message": "Login successful",
        "access_token": access_token,
        "token_type": "bearer",
        "admin": {
            "admin_id": admin["admin_id"],
            "name": admin["name"],
            "email": admin["email"],
            "hospital_name": admin["hospital_name"],
            "hospital_code": admin["hospital_code"],
            "role": "hospital_admin",
        },
    }


@router.get("/profile")
def hospital_profile(current: dict = Depends(get_current_admin)):
    admin = hospital_admins_collection.find_one(
        {"admin_id": current["admin_id"]}, {"_id": 0, "password": 0}
    )
    if not admin:
        raise HTTPException(status_code=404, detail="Admin not found")
    return admin


# ═══════════════════════════════════════════════
# 2️⃣  DEPARTMENT MANAGEMENT
# ═══════════════════════════════════════════════

@router.post("/departments")
def create_department(
    data: DepartmentCreate,
    current: dict = Depends(get_current_admin),
):
    """Create a new hospital department."""
    existing = departments_collection.find_one({
        "name": data.name,
        "hospital_code": current["hospital_code"],
    })
    if existing:
        raise HTTPException(status_code=400, detail="Department already exists")

    dept = {
        "department_id": f"DEPT-{uuid.uuid4().hex[:8].upper()}",
        "name": data.name,
        "head_doctor_id": data.head_doctor_id,
        "description": data.description,
        "hospital_code": current["hospital_code"],
        "created_at": datetime.utcnow().isoformat(),
    }
    departments_collection.insert_one(dept)
    dept.pop("_id", None)
    return {"status": "created", "department": dept}


@router.get("/departments")
def list_departments(current: dict = Depends(get_current_admin)):
    """List all departments for this hospital."""
    depts = list(departments_collection.find(
        {"hospital_code": current["hospital_code"]}, {"_id": 0}
    ))
    return {"hospital_code": current["hospital_code"], "departments": depts}


@router.put("/departments/{name}")
def update_department(
    name: str,
    data: DepartmentCreate,
    current: dict = Depends(get_current_admin),
):
    """Update an existing department."""
    result = departments_collection.update_one(
        {"name": name, "hospital_code": current["hospital_code"]},
        {"$set": {
            "name": data.name,
            "head_doctor_id": data.head_doctor_id,
            "description": data.description,
            "updated_at": datetime.utcnow().isoformat(),
        }},
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Department not found")
    return {"status": "updated", "department": data.name}


@router.delete("/departments/{name}")
def delete_department(name: str, current: dict = Depends(get_current_admin)):
    """Delete a department."""
    result = departments_collection.delete_one({
        "name": name, "hospital_code": current["hospital_code"]
    })
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Department not found")
    return {"status": "deleted", "department": name}


# ═══════════════════════════════════════════════
# 3️⃣  REGISTER & VERIFY DOCTORS
# ═══════════════════════════════════════════════

@router.post("/register-doctor")
def register_doctor(
    data: dict,
    current: dict = Depends(get_current_admin),
):
    """Register a new doctor under this hospital.

    Body: { name, email, password, specialization?, phone?, role?, department? }
    Creates the doctor document AND an active association with this hospital.
    """
    name = data.get("name", "")
    email = data.get("email", "")
    password = data.get("password", "")
    specialization = data.get("specialization", "General Medicine")
    phone = data.get("phone", "")
    role = data.get("role", "doctor")
    department = data.get("department", "")

    if not name or not email or not password:
        raise HTTPException(status_code=400, detail="name, email, password are required")
    if len(password) < 6:
        raise HTTPException(status_code=400, detail="Password must be at least 6 characters")

    existing = doctors_collection.find_one({"email": email})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")

    from app.services.patient_id_generator import generate_doctor_id
    doctor_id = generate_doctor_id()
    hospital_code = current["hospital_code"]
    hospital_name = current["hospital_name"]

    doctor = {
        "doctor_id": doctor_id,
        "name": name,
        "email": email,
        "password": hash_password(password),
        "specialization": specialization,
        "phone": phone,
        "role": "doctor",
        "hospital_code": hospital_code,        # primary / last assigned
        "department": department,
        "role_level": role,
        "verified": False,
        "verified_by": "",
        "verified_at": "",
        "created_at": datetime.utcnow().isoformat(),
    }
    doctors_collection.insert_one(doctor)

    # Create the doctor–hospital association record
    assoc = {
        "association_id": f"ASSOC-{uuid.uuid4().hex[:8].upper()}",
        "doctor_id": doctor_id,
        "hospital_code": hospital_code,
        "hospital_name": hospital_name,
        "role": role,
        "department": department,
        "status": "active",
        "assigned_by": current["admin_id"],
        "created_at": datetime.utcnow().isoformat(),
    }
    doctor_hospital_associations_collection.insert_one(assoc)

    # Audit
    log_emergency_access(
        patient_id="",
        role="hospital_admin",
        mode="DOCTOR_MANAGEMENT",
        detail=f"Registered doctor {doctor_id} ({name}) and created association",
        actor_id=current["admin_id"],
        hospital_code=hospital_code,
    )

    return {
        "message": "Doctor registered by hospital",
        "doctor_id": doctor_id,
        "name": name,
        "hospital_code": hospital_code,
        "association_id": assoc["association_id"],
        "verified": False,
    }


@router.post("/assign-doctor")
def assign_doctor(
    data: DoctorAssignRequest,
    current: dict = Depends(get_current_admin),
):
    """Assign an existing doctor to this hospital (create association).

    Used when a doctor already exists in the system but needs to be
    affiliated with this hospital (e.g. transfer from another hospital,
    or a doctor working at multiple hospitals).
    """
    doctor = doctors_collection.find_one({"doctor_id": data.doctor_id})
    if not doctor:
        raise HTTPException(status_code=404, detail="Doctor not found")

    hospital_code = current["hospital_code"]
    hospital_name = current["hospital_name"]

    # Check for existing active association
    existing = doctor_hospital_associations_collection.find_one({
        "doctor_id": data.doctor_id,
        "hospital_code": hospital_code,
        "status": "active",
    })
    if existing:
        raise HTTPException(
            status_code=400,
            detail="Doctor already has an active association with this hospital",
        )

    assoc = {
        "association_id": f"ASSOC-{uuid.uuid4().hex[:8].upper()}",
        "doctor_id": data.doctor_id,
        "hospital_code": hospital_code,
        "hospital_name": hospital_name,
        "role": data.role or "doctor",
        "department": data.department or "",
        "status": "active",
        "assigned_by": current["admin_id"],
        "created_at": datetime.utcnow().isoformat(),
    }
    doctor_hospital_associations_collection.insert_one(assoc)

    # Also update the primary hospital_code on the doctor doc
    doctors_collection.update_one(
        {"doctor_id": data.doctor_id},
        {"$set": {"hospital_code": hospital_code}},
    )

    # Audit
    log_emergency_access(
        patient_id="",
        role="hospital_admin",
        mode="DOCTOR_MANAGEMENT",
        detail=f"Assigned doctor {data.doctor_id} to hospital {hospital_code}",
        actor_id=current["admin_id"],
        hospital_code=hospital_code,
    )

    return {
        "message": f"Doctor {data.doctor_id} assigned to {hospital_name}",
        "association_id": assoc["association_id"],
        "hospital_code": hospital_code,
    }


@router.post("/revoke-doctor")
def revoke_doctor(
    data: DoctorTransferRequest,
    current: dict = Depends(get_current_admin),
):
    """Revoke a doctor's association with this hospital.

    The doctor's global account remains intact — only this hospital's
    association is marked as 'revoked'.
    """
    hospital_code = current["hospital_code"]

    result = doctor_hospital_associations_collection.update_one(
        {
            "doctor_id": data.doctor_id,
            "hospital_code": hospital_code,
            "status": "active",
        },
        {"$set": {
            "status": "revoked",
            "revoked_by": current["admin_id"],
            "revoked_at": datetime.utcnow().isoformat(),
            "transfer_note": data.reason or "Revoked by hospital admin",
        }},
    )
    if result.matched_count == 0:
        raise HTTPException(
            status_code=404,
            detail="No active association found for this doctor at this hospital",
        )

    # Audit
    log_emergency_access(
        patient_id="",
        role="hospital_admin",
        mode="DOCTOR_MOVEMENT",
        detail=f"Revoked doctor {data.doctor_id} from hospital {hospital_code}. Reason: {data.reason}",
        actor_id=current["admin_id"],
        hospital_code=hospital_code,
    )

    return {
        "message": f"Doctor {data.doctor_id} association revoked",
        "hospital_code": hospital_code,
        "status": "revoked",
    }


@router.post("/transfer-doctor")
def transfer_doctor_out(
    data: DoctorTransferRequest,
    current: dict = Depends(get_current_admin),
):
    """Transfer a doctor out of this hospital — marks association as 'transferred'.

    The receiving hospital should then call /hospital/assign-doctor to
    create a new active association at their end.
    """
    hospital_code = current["hospital_code"]

    result = doctor_hospital_associations_collection.update_one(
        {
            "doctor_id": data.doctor_id,
            "hospital_code": hospital_code,
            "status": "active",
        },
        {"$set": {
            "status": "transferred",
            "revoked_by": current["admin_id"],
            "revoked_at": datetime.utcnow().isoformat(),
            "transfer_note": data.reason or "Transferred out",
        }},
    )
    if result.matched_count == 0:
        raise HTTPException(
            status_code=404,
            detail="No active association found for this doctor at this hospital",
        )

    # Audit
    log_emergency_access(
        patient_id="",
        role="hospital_admin",
        mode="DOCTOR_MOVEMENT",
        detail=f"Transferred doctor {data.doctor_id} out of hospital {hospital_code}. Reason: {data.reason}",
        actor_id=current["admin_id"],
        hospital_code=hospital_code,
    )

    return {
        "message": f"Doctor {data.doctor_id} transferred out",
        "hospital_code": hospital_code,
        "status": "transferred",
    }


@router.get("/doctor-associations/{doctor_id}")
def get_doctor_associations(
    doctor_id: str,
    current: dict = Depends(get_current_admin),
):
    """View all hospital associations for a given doctor (active + past)."""
    associations = list(
        doctor_hospital_associations_collection.find(
            {"doctor_id": doctor_id}, {"_id": 0}
        ).sort("created_at", -1)
    )
    return {
        "doctor_id": doctor_id,
        "total": len(associations),
        "associations": associations,
    }


@router.put("/verify-doctor")
def verify_doctor(
    data: DoctorVerification,
    current: dict = Depends(get_current_admin),
):
    """Verify a doctor and assign specialization / department / role level."""
    doctor = doctors_collection.find_one({"doctor_id": data.doctor_id})
    if not doctor:
        raise HTTPException(status_code=404, detail="Doctor not found")

    update_fields = {
        "verified": data.verified,
        "verified_by": current["admin_id"],
        "verified_at": datetime.utcnow().isoformat(),
    }
    if data.specialization:
        update_fields["specialization"] = data.specialization
    if data.department:
        update_fields["department"] = data.department
    if data.role_level:
        update_fields["role_level"] = data.role_level

    doctors_collection.update_one(
        {"doctor_id": data.doctor_id}, {"$set": update_fields}
    )

    # Also update association role/department if they exist
    assoc_update = {}
    if data.department:
        assoc_update["department"] = data.department
    if data.role_level:
        assoc_update["role"] = data.role_level
    if assoc_update:
        doctor_hospital_associations_collection.update_one(
            {
                "doctor_id": data.doctor_id,
                "hospital_code": current["hospital_code"],
                "status": "active",
            },
            {"$set": assoc_update},
        )

    return {
        "status": "verified" if data.verified else "unverified",
        "doctor_id": data.doctor_id,
        "updated_fields": list(update_fields.keys()),
    }


@router.get("/doctors")
def list_doctors(current: dict = Depends(get_current_admin)):
    """List all doctors associated with this hospital (via associations collection)."""
    hospital_code = current["hospital_code"]

    # Get active associations for this hospital
    active_assocs = list(
        doctor_hospital_associations_collection.find(
            {"hospital_code": hospital_code, "status": "active"}, {"_id": 0}
        )
    )
    active_doctor_ids = [a["doctor_id"] for a in active_assocs]

    # Fetch doctor profiles for those IDs
    doctors = []
    if active_doctor_ids:
        docs = list(doctors_collection.find(
            {"doctor_id": {"$in": active_doctor_ids}},
            {"_id": 0, "password": 0},
        ))
        # Merge association info into doctor profile
        assoc_map = {a["doctor_id"]: a for a in active_assocs}
        for d in docs:
            a = assoc_map.get(d["doctor_id"], {})
            d["association_role"] = a.get("role", "doctor")
            d["association_department"] = a.get("department", "")
            d["association_status"] = a.get("status", "active")
            d["assigned_by"] = a.get("assigned_by", "")
            d["association_id"] = a.get("association_id", "")
            doctors.append(d)

    # Also list doctors with legacy hospital_code but no association record
    legacy_docs = list(doctors_collection.find(
        {
            "hospital_code": hospital_code,
            "doctor_id": {"$nin": active_doctor_ids},
        },
        {"_id": 0, "password": 0},
    ))

    # Unaffiliated doctors (no hospital at all)
    unaffiliated = list(doctors_collection.find(
        {"$or": [
            {"hospital_code": None},
            {"hospital_code": ""},
            {"hospital_code": {"$exists": False}},
        ]},
        {"_id": 0, "password": 0},
    ))

    return {
        "hospital_doctors": doctors,
        "legacy_doctors": legacy_docs,
        "unaffiliated_doctors": unaffiliated,
    }


@router.get("/doctors/{doctor_id}")
def get_doctor_detail(doctor_id: str, current: dict = Depends(get_current_admin)):
    """Get detailed doctor profile."""
    doctor = doctors_collection.find_one(
        {"doctor_id": doctor_id}, {"_id": 0, "password": 0}
    )
    if not doctor:
        raise HTTPException(status_code=404, detail="Doctor not found")
    return doctor


# ═══════════════════════════════════════════════
# 4️⃣  MONITOR RECORD ACCESS
# ═══════════════════════════════════════════════

@router.get("/record-access")
def monitor_record_access(current: dict = Depends(get_current_admin)):
    """Return recent record access events: emergency scans, auto-shares, etc."""
    # Audit logs (emergency access)
    access_logs = list(audit_logs_collection.find(
        {}, {"_id": 0}
    ).sort("timestamp", -1).limit(200))

    # Shared access records (auto-shares to hospitals)
    shared = list(shared_access_collection.find(
        {}, {"_id": 0}
    ).sort("created_at", -1).limit(100))

    return {
        "emergency_access_logs": access_logs,
        "auto_shared_records": shared,
        "total_access_events": len(access_logs),
        "total_auto_shares": len(shared),
    }


# ═══════════════════════════════════════════════
# 5️⃣  AUDIT LOGS
# ═══════════════════════════════════════════════

@router.get("/audit-logs")
def view_audit_logs(
    current: dict = Depends(get_current_admin),
    limit: int = 200,
    patient_id: str = "",
    mode: str = "",
    hospital_only: bool = False,
):
    """View full audit trail with optional filters.
    Set hospital_only=true to see only logs from this hospital."""
    query = {}
    if patient_id:
        query["patient_id"] = patient_id
    if mode:
        query["mode"] = mode.upper()
    if hospital_only:
        query["hospital_code"] = current["hospital_code"]

    logs = list(audit_logs_collection.find(
        query, {"_id": 0}
    ).sort("timestamp", -1).limit(limit))

    return {
        "total": len(logs),
        "filters": {"patient_id": patient_id, "mode": mode, "hospital_only": hospital_only},
        "logs": logs,
    }


# ═══════════════════════════════════════════════
# 6️⃣  COMPLIANCE & REPORTS
# ═══════════════════════════════════════════════

@router.post("/compliance-report")
def generate_compliance_report(
    filters: ComplianceReportRequest,
    current: dict = Depends(get_current_admin),
):
    """Generate a compliance summary report.

    Includes:
      - Total patients
      - Total doctors (verified / unverified)
      - Emergency sessions count & severity breakdown
      - Auto-share events
      - Access log summary
    """
    hospital_code = current["hospital_code"]

    # Doctors summary
    total_doctors = doctors_collection.count_documents({"hospital_code": hospital_code})
    verified_doctors = doctors_collection.count_documents({
        "hospital_code": hospital_code, "verified": True
    })
    unverified_doctors = total_doctors - verified_doctors

    # Patients
    total_patients = patients_collection.count_documents({})

    # Emergency sessions
    session_query = {}
    if filters.start_date:
        session_query["timestamp"] = {"$gte": filters.start_date}
    if filters.end_date:
        session_query.setdefault("timestamp", {})["$lte"] = filters.end_date

    total_sessions = emergency_sessions_collection.count_documents(session_query)

    # Severity breakdown
    severity_pipeline = [
        {"$match": session_query} if session_query else {"$match": {}},
        {"$group": {"_id": "$severity", "count": {"$sum": 1}}},
    ]
    severity_counts = {}
    for doc in emergency_sessions_collection.aggregate(severity_pipeline):
        severity_counts[doc["_id"] or "UNKNOWN"] = doc["count"]

    # Auto-share events
    share_query = {}
    if filters.patient_id:
        share_query["patient_id"] = filters.patient_id
    total_auto_shares = shared_access_collection.count_documents(share_query)

    # Access logs
    log_query = {}
    if filters.patient_id:
        log_query["patient_id"] = filters.patient_id
    if filters.doctor_id:
        log_query["role"] = "doctor"
    total_access_events = audit_logs_collection.count_documents(log_query)

    return {
        "report_generated_at": datetime.utcnow().isoformat(),
        "hospital_code": hospital_code,
        "hospital_name": current["hospital_name"],
        "filters_applied": filters.dict(),
        "summary": {
            "total_patients": total_patients,
            "total_doctors": total_doctors,
            "verified_doctors": verified_doctors,
            "unverified_doctors": unverified_doctors,
            "total_emergency_sessions": total_sessions,
            "severity_breakdown": severity_counts,
            "total_auto_shares": total_auto_shares,
            "total_access_events": total_access_events,
        },
    }


# ═══════════════════════════════════════════════
# 7️⃣  PATIENT REGISTRY (Hospital View)
# ═══════════════════════════════════════════════

@router.get("/patients/search")
def search_patients(
    patient_id: str = "",
    name: str = "",
    current: dict = Depends(get_current_admin),
):
    """Search patients by patient_id or name (partial match)."""
    query = {}
    if patient_id:
        query["patient_id"] = {"$regex": patient_id, "$options": "i"}
    if name:
        query["name"] = {"$regex": name, "$options": "i"}
    if not query:
        return {"patients": []}

    results = list(patients_collection.find(
        query, {"_id": 0, "password": 0}
    ).limit(50))

    return {"patients": results}


@router.get("/patients/{patient_id}")
def get_patient_detail(
    patient_id: str,
    current: dict = Depends(get_current_admin),
):
    """Get full patient demographics, consent status, and medical summary."""
    patient = patients_collection.find_one(
        {"patient_id": patient_id}, {"_id": 0, "password": 0}
    )
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")

    # Consent status
    consent_rec = consent_collection.find_one(
        {"patient_id": patient_id}, {"_id": 0},
        sort=[("created_at", -1)]
    )
    consent_granted = False
    if consent_rec:
        consent_granted = bool(consent_rec.get("granted", False))
        if consent_rec.get("expires_at") and hasattr(consent_rec["expires_at"], "isoformat"):
            consent_rec["expires_at"] = consent_rec["expires_at"].isoformat()
        if consent_rec.get("created_at") and hasattr(consent_rec["created_at"], "isoformat"):
            consent_rec["created_at"] = consent_rec["created_at"].isoformat()

    # Hospital-specific visit history (consultations from this hospital)
    hospital_code = current["hospital_code"]
    visits = list(consultations_collection.find(
        {"patient_id": patient_id, "hospital_code": hospital_code},
        {"_id": 0}
    ).sort("timestamp", -1).limit(50))
    for v in visits:
        if v.get("created_at") and hasattr(v["created_at"], "isoformat"):
            v["created_at"] = v["created_at"].isoformat()

    return {
        "patient": patient,
        "consent": consent_rec or {"granted": False},
        "consent_granted": consent_granted,
        "visit_history": visits,
    }


# ═══════════════════════════════════════════════
# 8️⃣  ENHANCED AUDIT LOGS & COMPLIANCE
# ═══════════════════════════════════════════════

@router.get("/audit-logs/enhanced")
def enhanced_audit_logs(
    current: dict = Depends(get_current_admin),
    limit: int = 500,
    patient_id: str = "",
    doctor_id: str = "",
    access_type: str = "",      # EMERGENCY | NORMAL_CONSULTATION | QR_SCAN | etc
    date_from: str = "",        # ISO date string
    date_to: str = "",          # ISO date string
):
    """Enhanced audit logs with rich filtering for compliance."""
    query = {}
    if patient_id:
        query["patient_id"] = {"$regex": patient_id, "$options": "i"}
    if doctor_id:
        query["actor_id"] = {"$regex": doctor_id, "$options": "i"}
    if access_type:
        query["mode"] = access_type.upper()
    if date_from:
        query.setdefault("timestamp", {})["$gte"] = date_from
    if date_to:
        query.setdefault("timestamp", {})["$lte"] = date_to

    logs = list(audit_logs_collection.find(
        query, {"_id": 0}
    ).sort("timestamp", -1).limit(limit))

    # Gather distinct access types for filter dropdowns
    access_types = audit_logs_collection.distinct("mode")

    return {
        "total": len(logs),
        "filters": {
            "patient_id": patient_id,
            "doctor_id": doctor_id,
            "access_type": access_type,
            "date_from": date_from,
            "date_to": date_to,
        },
        "access_types": access_types,
        "logs": logs,
    }


# ═══════════════════════════════════════════════
# 9️⃣  DASHBOARD STATS (Live KPIs)
# ═══════════════════════════════════════════════

@router.get("/dashboard-stats")
def dashboard_stats(current: dict = Depends(get_current_admin)):
    """Return live KPI numbers for the hospital dashboard home page."""
    hospital_code = current["hospital_code"]

    # 1. Total registered doctors at this hospital
    total_doctors = doctor_hospital_associations_collection.count_documents(
        {"hospital_code": hospital_code, "status": "active"}
    )

    # 2. Total patients in the system
    total_patients = patients_collection.count_documents({})

    # 3. Emergency scans today (audit logs with mode EMERGENCY for today)
    today_str = datetime.utcnow().strftime("%Y-%m-%d")
    emergency_today = audit_logs_collection.count_documents({
        "hospital_code": hospital_code,
        "mode": "EMERGENCY",
        "timestamp": {"$regex": f"^{today_str}"},
    })

    # 4. Total consultations today
    consultations_today = consultations_collection.count_documents({
        "hospital_code": hospital_code,
        "timestamp": {"$regex": f"^{today_str}"},
    })

    return {
        "total_doctors": total_doctors,
        "total_patients": total_patients,
        "emergency_scans_today": emergency_today,
        "consultations_today": consultations_today,
    }
