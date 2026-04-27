from typing import Dict, List, Optional, Set, Tuple

from .interaction_database import DRUG_CONDITION_RULES, DRUG_INTERACTION_RULES


def _normalize_drug(name: str) -> str:
	return " ".join(str(name).strip().lower().split())


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


def check_drug_interactions(
	prescribed_drugs,
	existing_medications=None,
	patient_conditions=None,
	interaction_rules: Optional[List[Dict[str, str]]] = None,
	condition_rules: Optional[List[Dict[str, str]]] = None,
) -> Dict:
	interaction_rules = interaction_rules or DRUG_INTERACTION_RULES
	condition_rules = condition_rules or DRUG_CONDITION_RULES

	prescribed_list = _as_list(prescribed_drugs)
	existing_list = _as_list(existing_medications)
	conditions = [_normalize_drug(c) for c in _as_list(patient_conditions)]

	normalized_prescribed = [_normalize_drug(d) for d in prescribed_list]
	normalized_existing = [_normalize_drug(d) for d in existing_list]
	all_medications = list(dict.fromkeys(normalized_existing + normalized_prescribed))

	warnings: List[Dict[str, str]] = []
	seen_pairs: Set[Tuple[str, str, str]] = set()

	for rule in interaction_rules:
		a = _normalize_drug(rule.get("drug_a", ""))
		b = _normalize_drug(rule.get("drug_b", ""))
		if not a or not b:
			continue

		if a in all_medications and b in all_medications:
			key = tuple(sorted([a, b])) + (rule.get("risk", ""),)
			if key in seen_pairs:
				continue
			seen_pairs.add(key)

			warnings.append(
				{
					"type": "drug_drug",
					"severity": rule.get("severity", "medium"),
					"drug_a": a,
					"drug_b": b,
					"risk": rule.get("risk", "interaction risk"),
					"recommendation": rule.get("recommendation", "Review regimen before prescribing."),
					"message": f"{a.title()} + {b.title()} {rule.get('risk', 'interaction risk')}.",
				}
			)

	seen_condition_hits: Set[Tuple[str, str, str]] = set()
	for drug in normalized_prescribed:
		for rule in condition_rules:
			rule_drug = _normalize_drug(rule.get("drug", ""))
			rule_condition = _normalize_drug(rule.get("condition", ""))
			if not rule_drug or not rule_condition:
				continue
			if drug != rule_drug:
				continue

			if any(rule_condition in cond for cond in conditions):
				key = (drug, rule_condition, rule.get("risk", ""))
				if key in seen_condition_hits:
					continue
				seen_condition_hits.add(key)
				warnings.append(
					{
						"type": "drug_condition",
						"severity": rule.get("severity", "medium"),
						"drug": drug,
						"condition": rule_condition,
						"risk": rule.get("risk", "condition-related risk"),
						"recommendation": rule.get("recommendation", "Adjust treatment plan."),
						"message": f"{drug.title()} in {rule_condition.title()} patient {rule.get('risk', 'condition-related risk')}.",
					}
				)

	severity_rank = {"critical": 4, "high": 3, "medium": 2, "low": 1}
	warnings.sort(key=lambda w: severity_rank.get(w.get("severity", "low"), 1), reverse=True)

	return {
		"title": "⚠ Drug Interaction Warning",
		"warnings": warnings,
		"has_warnings": len(warnings) > 0,
		"warning_count": len(warnings),
		"highest_severity": warnings[0]["severity"] if warnings else "none",
	}

