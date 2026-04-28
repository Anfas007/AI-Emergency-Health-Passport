#!/usr/bin/env python3
"""Diagnostic test for drug interaction normalization."""

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))

from ai_engine.drug_interaction_checker import (
    _normalize_drug, _as_list, _build_interaction_lookup, 
    check_drug_interactions, DRUG_INTERACTION_RULES
)

print("\n" + "="*70)
print("🔍 DRUG INTERACTION NORMALIZATION DIAGNOSTIC")
print("="*70)

# Test normalization
print("\n" + "-"*70)
print("Normalization Tests")
print("-"*70)

drugs_to_test = [
    "Aspirin 500mg",
    "aspirin",
    "ASPIRIN",
    "Warfarin 5mg",
    "warfarin",
    "Lisinopril 10mg daily",
    "lisinopril",
]

for drug in drugs_to_test:
    normalized = _normalize_drug(drug)
    print(f"  '{drug}' → '{normalized}'")

# Test _as_list
print("\n" + "-"*70)
print("List Conversion Tests")
print("-"*70)

test_lists = [
    "Aspirin 500mg",
    ["Aspirin 500mg", "Warfarin 5mg"],
    "Aspirin 500mg, Warfarin 5mg",
    ["Aspirin 500mg, Warfarin 5mg"],
]

for test_val in test_lists:
    result = _as_list(test_val)
    print(f"  {repr(test_val)} → {result}")

# Test interaction lookup
print("\n" + "-"*70)
print("Interaction Rules Lookup")
print("-"*70)

lookup, meta = _build_interaction_lookup(DRUG_INTERACTION_RULES)
print(f"Total interaction rules: {len(lookup)}")

aspirin_key = _normalize_drug("aspirin")
warfarin_key = _normalize_drug("warfarin")

print(f"\nNormalized aspirin: '{aspirin_key}'")
print(f"Normalized warfarin: '{warfarin_key}'")

if aspirin_key in lookup:
    targets = lookup[aspirin_key]
    print(f"  Aspirin interacts with: {targets}")
    print(f"  Warfarin in targets? {warfarin_key in targets}")

if warfarin_key in lookup:
    targets = lookup[warfarin_key]
    print(f"  Warfarin interacts with: {targets}")
    print(f"  Aspirin in targets? {aspirin_key in targets}")

# Test check_drug_interactions directly
print("\n" + "-"*70)
print("Direct check_drug_interactions Test")
print("-"*70)

result = check_drug_interactions(
    prescribed_drugs=["Aspirin 500mg"],
    existing_medications=["Warfarin 5mg"],
    patient_conditions=[],
    debug=True  # Enable debug output
)

print(f"\nResult:")
print(f"  Has warnings: {result['has_warnings']}")
print(f"  Warning count: {result['warning_count']}")
print(f"  Warnings: {result['warnings']}")

print("\n" + "="*70)
