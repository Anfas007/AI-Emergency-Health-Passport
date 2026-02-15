from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime

class Patient(BaseModel):
    name: str
    age: int
    gender: str
    blood_group: Optional[str] = None
    allergies: Optional[str] = None
    chronic_conditions: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
