from typing import Dict, List, Set


ALLERGY_ALERT_RULES = {
	"penicillin": "Penicillin Allergy",
	"sulfa": "Sulfa Allergy",
	"latex": "Latex Allergy",
	"iodine": "Iodine/Contrast Allergy",
	"nuts": "Severe Nut Allergy",
}

CHRONIC_RISK_RULES = {
	"hypertension": "Hypertension Risk",
	"diabetes": "Diabetes Patient",
	"asthma": "Asthma Risk",
	"chronic kidney disease": "Kidney Disease Risk",
	"heart failure": "Cardiac Failure Risk",
	"epilepsy": "Seizure Risk",
}

HIGH_RISK_CONDITION_RULES = {
	"anticoagulant": "High Bleeding Risk (On Blood Thinners)",
	"pregnancy": "Pregnancy High-Risk Consideration",
	"immunocompromised": "Immunocompromised Patient",
	"organ transplant": "Transplant History (High Risk)",
}

SURGERY_RULES = {
	"cardiac": "History of Cardiac Surgery",
	"heart": "History of Cardiac Surgery",
	"bypass": "History of Cardiac Surgery",
	"angioplasty": "History of Cardiac Procedure",
	"neuro": "History of Neurosurgery",
	"brain": "History of Neurosurgery",
	"transplant": "History of Organ Transplant Surgery",
}


def _normalize(value: str) -> str:
	return " ".join(str(value).strip().lower().split())


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


def generate_important_alerts(patient: Dict) -> Dict:
	allergies = _as_list(patient.get("allergies"))
	chronic_conditions = _as_list(patient.get("chronic_conditions") or patient.get("conditions"))
	high_risk_conditions = _as_list(
		patient.get("high_risk_conditions")
		or patient.get("risk_conditions")
		or patient.get("special_conditions")
	)
	past_surgeries = _as_list(patient.get("past_surgeries") or patient.get("surgery_history"))

	alerts: List[Dict[str, str]] = []
	seen: Set[str] = set()

	def _add_alert(label: str, category: str, severity: str = "high"):
		key = _normalize(label)
		if key in seen:
			return
		seen.add(key)
		alerts.append({"label": label, "category": category, "severity": severity})

	for item in allergies:
		normalized = _normalize(item)
		matched = False
		for keyword, label in ALLERGY_ALERT_RULES.items():
			if keyword in normalized:
				_add_alert(label, "allergy", "critical")
				matched = True
		if not matched:
			_add_alert(f"Allergy: {item}", "allergy", "high")

	for item in chronic_conditions:
		normalized = _normalize(item)
		matched = False
		for keyword, label in CHRONIC_RISK_RULES.items():
			if keyword in normalized:
				_add_alert(label, "chronic_condition", "high")
				matched = True
		if not matched:
			_add_alert(f"Chronic Condition: {item}", "chronic_condition", "medium")

	for item in past_surgeries:
		normalized = _normalize(item)
		matched = False
		for keyword, label in SURGERY_RULES.items():
			if keyword in normalized:
				_add_alert(label, "surgery_history", "high")
				matched = True
		if not matched:
			_add_alert(f"Past Surgery: {item}", "surgery_history", "medium")

	for item in high_risk_conditions:
		normalized = _normalize(item)
		matched = False
		for keyword, label in HIGH_RISK_CONDITION_RULES.items():
			if keyword in normalized:
				_add_alert(label, "high_risk_condition", "critical")
				matched = True
		if not matched:
			_add_alert(f"High-Risk Condition: {item}", "high_risk_condition", "high")

	return {
		"title": "⚠ Important Alerts",
		"alerts": alerts,
		"has_alerts": len(alerts) > 0,
		"critical_count": len([a for a in alerts if a["severity"] == "critical"]),
	}

