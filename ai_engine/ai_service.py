from typing import Dict, List, Optional

from .allergy_risk_alert import generate_important_alerts
from .drug_interaction_checker import check_drug_interactions
from .medical_summary import generate_emergency_medical_summary


def build_patient_risk_profile(patient: Dict) -> Dict:
	alerts = generate_important_alerts(patient)
	summary = generate_emergency_medical_summary(patient)
	return {
		"important_alerts": alerts,
		"emergency_summary": summary,
	}


def evaluate_prescription_safety(patient: Dict, prescribed_drugs: List[str]) -> Dict:
	return check_drug_interactions(
		prescribed_drugs=prescribed_drugs,
		existing_medications=patient.get("medications", []),
		patient_conditions=patient.get("chronic_conditions", []),
	)


def run_clinical_support(patient: Dict, prescribed_drugs: Optional[List[str]] = None) -> Dict:
	profile = build_patient_risk_profile(patient)
	response = {
		"patient_id": patient.get("patient_id", ""),
		"alerts": profile["important_alerts"],
		"summary": profile["emergency_summary"],
	}

	if prescribed_drugs:
		response["drug_interaction"] = evaluate_prescription_safety(patient, prescribed_drugs)

	return response

