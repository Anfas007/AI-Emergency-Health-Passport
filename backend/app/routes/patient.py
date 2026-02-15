from fastapi import APIRouter
from app.models.patient import Patient
from app.services.database import patients_collection
from app.services.patient_id_generator import generate_patient_id

router = APIRouter(prefix="/patients", tags=["Patients"])

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
