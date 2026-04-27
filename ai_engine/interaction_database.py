from typing import Dict, List


DRUG_INTERACTION_RULES: List[Dict[str, str]] = [
	{
		"drug_a": "aspirin",
		"drug_b": "warfarin",
		"risk": "may increase bleeding risk",
		"severity": "high",
		"recommendation": "Avoid combination or monitor INR and bleeding signs closely.",
	},
	{
		"drug_a": "metformin",
		"drug_b": "contrast dye",
		"risk": "may increase kidney injury risk",
		"severity": "high",
		"recommendation": "Hold metformin before contrast studies and reassess renal function.",
	},
	{
		"drug_a": "ibuprofen",
		"drug_b": "warfarin",
		"risk": "may increase bleeding risk",
		"severity": "high",
		"recommendation": "Prefer a safer analgesic and monitor coagulation closely.",
	},
	{
		"drug_a": "lisinopril",
		"drug_b": "spironolactone",
		"risk": "may increase hyperkalemia risk",
		"severity": "medium",
		"recommendation": "Monitor potassium and renal function.",
	},
	{
		"drug_a": "clarithromycin",
		"drug_b": "simvastatin",
		"risk": "may increase risk of myopathy/rhabdomyolysis",
		"severity": "high",
		"recommendation": "Avoid this combination or temporarily stop statin.",
	},
]


DRUG_CONDITION_RULES: List[Dict[str, str]] = [
	{
		"drug": "aspirin",
		"condition": "peptic ulcer",
		"risk": "can worsen gastrointestinal bleeding",
		"severity": "high",
		"recommendation": "Use gastroprotection or an alternative agent.",
	},
	{
		"drug": "metformin",
		"condition": "kidney disease",
		"risk": "can increase lactic acidosis risk",
		"severity": "high",
		"recommendation": "Assess eGFR before prescribing and adjust/avoid if needed.",
	},
	{
		"drug": "propranolol",
		"condition": "asthma",
		"risk": "can trigger bronchospasm",
		"severity": "high",
		"recommendation": "Consider cardio-selective or alternative therapy.",
	},
	{
		"drug": "pseudoephedrine",
		"condition": "hypertension",
		"risk": "can raise blood pressure",
		"severity": "medium",
		"recommendation": "Avoid or monitor blood pressure carefully.",
	},
]

