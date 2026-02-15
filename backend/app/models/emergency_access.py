from pydantic import BaseModel
from datetime import datetime

class EmergencyAccess(BaseModel):
    patient_id: str
    role: str  # doctor / hospital
    expires_at: datetime
