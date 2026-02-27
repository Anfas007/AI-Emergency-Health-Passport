from pydantic import BaseModel
from typing import Optional, List


class HospitalAdmin(BaseModel):
    """Hospital administrator signup payload."""
    name: str
    email: str
    password: str
    hospital_name: str
    hospital_code: Optional[str] = ""       # e.g. "MGH-001"
    phone: Optional[str] = ""


class HospitalLogin(BaseModel):
    email: str
    password: str


class DepartmentCreate(BaseModel):
    """Create or update a hospital department."""
    name: str                                # e.g. "Cardiology", "Emergency"
    head_doctor_id: Optional[str] = ""       # doctor_id of the head
    description: Optional[str] = ""


class DoctorVerification(BaseModel):
    """Verify a doctor and optionally assign specialization / department."""
    doctor_id: str
    verified: bool = True
    specialization: Optional[str] = ""       # e.g. "Cardiologist"
    department: Optional[str] = ""           # department name
    role_level: Optional[str] = "doctor"     # doctor | senior_doctor | hod


class ComplianceReportRequest(BaseModel):
    """Optional filters for compliance report generation."""
    start_date: Optional[str] = ""           # ISO date string
    end_date: Optional[str] = ""
    patient_id: Optional[str] = ""
    doctor_id: Optional[str] = ""


# ═══════════════════════════════════════════════
#  Doctor–Hospital Association (RBAC)
# ═══════════════════════════════════════════════

class DoctorHospitalAssociation(BaseModel):
    """Represents a doctor's affiliation with a specific hospital.

    Each doctor has a global Doctor ID but may work at one or more hospitals.
    This model tracks the relationship with RBAC roles, status, and timestamps
    so doctor movement between hospitals is fully auditable.
    """
    doctor_id: str                                     # global doctor ID
    hospital_code: str                                 # hospital this association belongs to
    role: Optional[str] = "doctor"                     # doctor | specialist | emergency_doctor | hod
    department: Optional[str] = ""                     # e.g. "Cardiology"
    status: Optional[str] = "active"                   # active | revoked | transferred
    assigned_by: Optional[str] = ""                    # admin_id who created this association
    revoked_by: Optional[str] = ""                     # admin_id who revoked (if applicable)
    revoked_at: Optional[str] = ""                     # ISO timestamp of revocation
    transfer_note: Optional[str] = ""                  # reason for transfer / revocation


class DoctorAssignRequest(BaseModel):
    """Payload to assign an existing doctor to this hospital."""
    doctor_id: str
    role: Optional[str] = "doctor"
    department: Optional[str] = ""


class DoctorTransferRequest(BaseModel):
    """Payload to transfer a doctor out (revoke at current hospital)."""
    doctor_id: str
    reason: Optional[str] = ""


class HospitalSelectRequest(BaseModel):
    """Doctor chooses which hospital to operate under for this session."""
    hospital_code: str
