#!/usr/bin/env python3
"""Test which ai_engine module is being used."""

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))

from app.services.clinical_rules_service import get_drug_interaction_warnings
import app.services.clinical_rules_service as svc_module
import ai_engine.ai_service as ai_module

print("\n" + "="*70)
print("🔍 MODULE LOCATION TEST")
print("="*70)

print(f"\nclinical_rules_service module: {svc_module.__file__}")
print(f"ai_engine.ai_service module: {ai_module.__file__}")

# Now let's trace what happens when we call get_drug_interaction_warnings
print("\n" + "-"*70)
print("Calling get_drug_interaction_warnings with single drug...")
print("-"*70)

patient = {
    "medications": ["Warfarin 5mg"],
    "chronic_conditions": [],
}
result = get_drug_interaction_warnings(patient, ["Aspirin 500mg"])

print(f"Result: {result}")
print(f"Has warnings: {result.get('has_warnings')}")
print(f"Warning count: {result.get('warning_count')}")

# Now let's test the ai_service directly
print("\n" + "-"*70)
print("Calling ai_service.evaluate_prescription_safety directly...")
print("-"*70)

from ai_engine.ai_service import evaluate_prescription_safety

result2 = evaluate_prescription_safety(patient, ["Aspirin 500mg"])
print(f"Result: {result2}")
print(f"Has warnings: {result2.get('has_warnings')}")
print(f"Warning count: {result2.get('warning_count')}")

# Now let's test check_drug_interactions directly
print("\n" + "-"*70)
print("Calling check_drug_interactions directly...")
print("-"*70)

from ai_engine.drug_interaction_checker import check_drug_interactions

result3 = check_drug_interactions(
    prescribed_drugs=["Aspirin 500mg"],
    existing_medications=["Warfarin 5mg"],
    patient_conditions=[],
)
print(f"Result: {result3}")
print(f"Has warnings: {result3.get('has_warnings')}")
print(f"Warning count: {result3.get('warning_count')}")

print("\n" + "="*70)
