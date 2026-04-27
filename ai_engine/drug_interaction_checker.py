import os
import re
from typing import Dict, List, Optional, Set, Tuple

from .interaction_database import DRUG_CONDITION_RULES, DRUG_INTERACTION_RULES


def _normalize_drug(name: str) -> str:
	value = " ".join(str(name).strip().lower().split())
	value = value.replace("-", " ").replace("/", " ")
	value = re.sub(r"[^a-z0-9\s]", "", value)
	value = re.sub(r"\b\d+(?:\.\d+)?\s*(?:mg|mcg|g|ml)\b", "", value)
	return " ".join(value.split())


def _extract_drug_names(item) -> List[str]:
	if item is None:
		return []
	if isinstance(item, str):
		return [item]
	if isinstance(item, dict):
		candidates: List[str] = []
		for key in ("name", "drug", "medication", "medicine", "generic_name", "brand_name"):
			value = item.get(key)
			if value is not None and str(value).strip():
				candidates.append(str(value))
		return candidates or [str(item)]
	return [str(item)]


def _as_list(value) -> List[str]:
	if value is None:
		return []
	if isinstance(value, list):
		result: List[str] = []
		for item in value:
			for name in _extract_drug_names(item):
				if name is None:
					continue
				if isinstance(name, str) and "," in name:
					result.extend([part.strip() for part in name.split(",") if part.strip()])
				elif str(name).strip():
					result.append(str(name).strip())
		return result
	if isinstance(value, str):
		if not value.strip():
			return []
		if "," in value:
			return [part.strip() for part in value.split(",") if part.strip()]
		return [value.strip()]
	return [str(value)]


def _is_debug_enabled(debug: Optional[bool]) -> bool:
	if debug is not None:
		return debug
	return os.getenv("DRUG_INTERACTION_DEBUG", "").strip().lower() in {"1", "true", "yes", "on"}


def _debug_log(enabled: bool, message: str) -> None:
	if enabled:
		print(f"[drug-interaction] {message}")


def _build_interaction_lookup(interaction_rules):
	"""Build pair lookup from either list-of-rules or dict format.

	Supported formats:
	- [{"drug_a": "aspirin", "drug_b": "warfarin", ...}, ...]
	- {"aspirin": ["warfarin", "heparin"]}
	"""
	lookup: Dict[str, Set[str]] = {}
	meta: Dict[Tuple[str, str], Dict[str, str]] = {}

	if isinstance(interaction_rules, dict):
		for drug, targets in interaction_rules.items():
			a = _normalize_drug(drug)
			if not a:
				continue
			for target in _as_list(targets):
				b = _normalize_drug(target)
				if not b:
					continue
				lookup.setdefault(a, set()).add(b)
				pair_key = tuple(sorted((a, b)))
				if pair_key not in meta:
					meta[pair_key] = {
						"severity": "high",
						"risk": "may cause a drug interaction",
						"recommendation": "Review regimen before prescribing.",
					}
		return lookup, meta

	for rule in interaction_rules or []:
		a = _normalize_drug(rule.get("drug_a", ""))
		b = _normalize_drug(rule.get("drug_b", ""))
		if not a or not b:
			continue

		lookup.setdefault(a, set()).add(b)
		pair_key = tuple(sorted((a, b)))
		meta[pair_key] = {
			"severity": rule.get("severity", "medium"),
			"risk": rule.get("risk", "interaction risk"),
			"recommendation": rule.get("recommendation", "Review regimen before prescribing."),
		}

	return lookup, meta


def check_drug_interactions(
	prescribed_drugs,
	existing_medications=None,
	patient_conditions=None,
	interaction_rules=None,
	condition_rules: Optional[List[Dict[str, str]]] = None,
	debug: Optional[bool] = None,
) -> Dict:
	interaction_rules = interaction_rules or DRUG_INTERACTION_RULES
	condition_rules = condition_rules or DRUG_CONDITION_RULES
	debug_enabled = _is_debug_enabled(debug)

	prescribed_list = _as_list(prescribed_drugs)
	existing_list = _as_list(existing_medications)
	conditions = [_normalize_drug(c) for c in _as_list(patient_conditions)]

	normalized_prescribed = [_normalize_drug(d) for d in prescribed_list]
	normalized_existing = [_normalize_drug(d) for d in existing_list]
	normalized_prescribed = [d for d in normalized_prescribed if d]
	normalized_existing = [d for d in normalized_existing if d]

	_debug_log(debug_enabled, f"input prescribed={prescribed_list}, existing={existing_list}, conditions={conditions}")
	_debug_log(debug_enabled, f"normalized prescribed={normalized_prescribed}, existing={normalized_existing}")

	lookup, interaction_meta = _build_interaction_lookup(interaction_rules)
	_debug_log(debug_enabled, f"interaction rule groups loaded={len(lookup)}")

	warnings: List[Dict[str, str]] = []
	seen_pairs: Set[Tuple[str, str, str]] = set()

	# Primary check: newly prescribed drugs against patient's existing meds.
	for new_drug in normalized_prescribed:
		for existing_drug in normalized_existing:
			if new_drug == existing_drug:
				continue

			forward_hit = existing_drug in lookup.get(new_drug, set())
			reverse_hit = new_drug in lookup.get(existing_drug, set())
			if not (forward_hit or reverse_hit):
				continue

			pair_key = tuple(sorted((new_drug, existing_drug)))
			meta = interaction_meta.get(
				pair_key,
				{
					"severity": "medium",
					"risk": "interaction risk",
					"recommendation": "Review regimen before prescribing.",
				},
			)

			seen_key = (pair_key[0], pair_key[1], meta.get("risk", "interaction risk"))
			if seen_key in seen_pairs:
				continue
			seen_pairs.add(seen_key)

			warnings.append(
				{
					"type": "drug_drug",
					"severity": meta.get("severity", "medium"),
					"drug_a": pair_key[0],
					"drug_b": pair_key[1],
					"risk": meta.get("risk", "interaction risk"),
					"recommendation": meta.get("recommendation", "Review regimen before prescribing."),
					"message": f"{pair_key[0].title()} + {pair_key[1].title()} {meta.get('risk', 'interaction risk')}.",
				}
			)
			_debug_log(debug_enabled, f"interaction match: new={new_drug}, existing={existing_drug}, pair={pair_key}")

	# Secondary check: interactions among newly prescribed drugs themselves.
	for idx, drug_a in enumerate(normalized_prescribed):
		for drug_b in normalized_prescribed[idx + 1 :]:
			if drug_a == drug_b:
				continue
			if not (drug_b in lookup.get(drug_a, set()) or drug_a in lookup.get(drug_b, set())):
				continue

			pair_key = tuple(sorted((drug_a, drug_b)))
			meta = interaction_meta.get(
				pair_key,
				{
					"severity": "medium",
					"risk": "interaction risk",
					"recommendation": "Review regimen before prescribing.",
				},
			)
			seen_key = (pair_key[0], pair_key[1], meta.get("risk", "interaction risk"))
			if seen_key in seen_pairs:
				continue
			seen_pairs.add(seen_key)

			warnings.append(
				{
					"type": "drug_drug",
					"severity": meta.get("severity", "medium"),
					"drug_a": pair_key[0],
					"drug_b": pair_key[1],
					"risk": meta.get("risk", "interaction risk"),
					"recommendation": meta.get("recommendation", "Review regimen before prescribing."),
					"message": f"{pair_key[0].title()} + {pair_key[1].title()} {meta.get('risk', 'interaction risk')}.",
				}
			)
			_debug_log(debug_enabled, f"interaction match (new-new): pair={pair_key}")

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
				_debug_log(debug_enabled, f"condition match: drug={drug}, condition={rule_condition}")
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
	_debug_log(debug_enabled, f"output warnings={len(warnings)}")

	return {
		"title": "⚠ Drug Interaction Warning",
		"warnings": warnings,
		"has_warnings": len(warnings) > 0,
		"warning_count": len(warnings),
		"highest_severity": warnings[0]["severity"] if warnings else "none",
	}

