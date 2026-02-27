from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import Optional
from datetime import datetime
import uuid
from app.services.database import doctors_collection, doctor_hospital_associations_collection, hospital_admins_collection
from app.services.auth_service import (
    hash_password,
    verify_password,
    create_access_token,
    get_current_doctor,
)
from app.models.hospital import HospitalSelectRequest

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


@router.post("/signup")
def signup(data: DoctorSignup):
    # Self-registration is disabled. Doctors must be registered by their
    # hospital administrator via the Hospital Dashboard.
    raise HTTPException(
        status_code=403,
        detail="Doctor self-signup is disabled. Please ask your hospital admin to register you via /hospital/register-doctor"
    )


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
