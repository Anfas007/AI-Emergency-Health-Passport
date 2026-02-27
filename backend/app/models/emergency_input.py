from pydantic import BaseModel
from typing import Optional

class EmergencyInput(BaseModel):
    patient_id: Optional[str] = ""   # optional – needed for auto-share on CRITICAL
    age: int
    heart_rate: int
    spo2: int
    systolic_bp: int
    diastolic_bp: int
    condition_text: str
