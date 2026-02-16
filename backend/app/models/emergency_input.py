from pydantic import BaseModel

class EmergencyInput(BaseModel):
    age: int
    heart_rate: int
    spo2: int
    systolic_bp: int
    diastolic_bp: int
    condition_text: str
