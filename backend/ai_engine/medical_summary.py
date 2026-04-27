from typing import Dict, List


def _as_list(value) -> List[str]:
	if value is None:
		return []
	if isinstance(value, list):
		return [str(v) for v in value if v is not None and str(v).strip()]
	if isinstance(value, str):
		if not value.strip():
			return []
		if "," in value:
			return [part.strip() for part in value.split(",") if part.strip()]
		return [value.strip()]
	return [str(value)]


def _pick_last_surgery(patient: Dict) -> str:
	surgeries = _as_list(patient.get("past_surgeries") or patient.get("surgery_history"))
	if surgeries:
		return surgeries[-1]

	previous_emergencies = _as_list(patient.get("previous_emergencies"))
	if previous_emergencies:
		for item in reversed(previous_emergencies):
			normalized = item.lower()
			if "surgery" in normalized or "operation" in normalized:
				return item
	return "N/A"


def generate_emergency_medical_summary(patient: Dict) -> Dict:
	summary = {
		"blood_group": patient.get("blood_group") or "N/A",
		"allergies": _as_list(patient.get("allergies")),
		"chronic_diseases": _as_list(patient.get("chronic_conditions") or patient.get("conditions")),
		"current_medications": _as_list(patient.get("medications")),
		"last_surgery": _pick_last_surgery(patient),
	}

	return {
		"title": "Emergency Medical Summary",
		"summary": summary,
		"summary_text": (
			f"Blood Group: {summary['blood_group']} | "
			f"Allergies: {', '.join(summary['allergies']) if summary['allergies'] else 'None'} | "
			f"Chronic Diseases: {', '.join(summary['chronic_diseases']) if summary['chronic_diseases'] else 'None'} | "
			f"Current Medications: {', '.join(summary['current_medications']) if summary['current_medications'] else 'None'} | "
			f"Last Surgery: {summary['last_surgery']}"
		),
	}

