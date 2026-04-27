from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime

class Patient(BaseModel):
    name: str
    age: int
    gender: str
    blood_group: Optional[str] = None
    allergies: Optional[str] = None
    chronic_conditions: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)


class MedicalRecordUpdate(BaseModel):
    """Payload for adding / updating verified medical records."""
    past_diagnoses: Optional[List[str]] = None
    medications: Optional[List[str]] = None
    allergies: Optional[List[str]] = None
    chronic_conditions: Optional[List[str]] = None
    previous_emergencies: Optional[List[str]] = None
    blood_group: Optional[str] = None


class ConsultationRecord(BaseModel):
    """Full normal consultation record saved by a doctor."""
    patient_id: str
    # Symptoms & vitals
    chief_complaint: Optional[str] = None
    reason_for_visit: Optional[str] = None
    symptoms: Optional[List[str]] = None
    clinical_observations: Optional[str] = None
    heart_rate: Optional[int] = None
    blood_pressure: Optional[str] = None
    temperature: Optional[float] = None
    spo2: Optional[int] = None
    respiratory_rate: Optional[int] = None
    weight: Optional[float] = None
    # Diagnosis & treatment
    provisional_diagnosis: Optional[str] = None
    final_diagnosis: Optional[str] = None
    treatment_plan: Optional[str] = None
    medications_prescribed: Optional[List[str]] = None
    medications_prescribed_details: Optional[List[dict]] = None
    follow_up_advice: Optional[str] = None
    follow_up_date: Optional[str] = None
