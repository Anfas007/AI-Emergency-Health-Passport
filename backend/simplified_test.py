#!/usr/bin/env python3
"""Simplified test to isolate the issue."""

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))

# Set UTF-8 encoding
import os
os.environ['PYTHONIOENCODING'] = 'utf-8'

# Import exactly like the test script does
from dotenv import load_dotenv
from app.services.clinical_rules_service import get_drug_interaction_warnings
from app.services.database import patient_accounts_collection, patients_collection

# Load env
for candidate in (Path(__file__).parent / ".env.local", Path(__file__).parent / ".env"):
    if candidate.exists():
        load_dotenv(candidate)
        break

print("\n" + "="*70)
print("SIMPLIFIED TEST")
print("="*70)

# Test with same exact parameters as test_drug_interactions.py
patient1 = {
    "medications": ["Warfarin 5mg daily"],
    "chronic_conditions": [],
    "allergies": []
}

print(f"\nTest 1: Calling get_drug_interaction_warnings")
print(f"Patient meds: {patient1['medications']}")
print(f"Prescribed: ['Aspirin 500mg']")

result1 = get_drug_interaction_warnings(patient1, ["Aspirin 500mg"])

print(f"\nResult:")
print(f"  has_warnings: {result1['has_warnings']}")
print(f"  warning_count: {result1['warning_count']}")
print(f"  warnings: {result1['warnings']}")

if not result1['has_warnings']:
    print("\n⚠️ WARNING: No warnings found! Investigating...")
    
    # Now test with MULTIPLE drugs like Test 4
    print("\nTest 4 (Multiple drugs): Same existing meds, multiple new drugs")
    result4 = get_drug_interaction_warnings(
        {
            "medications": ["Warfarin 5mg", "Lisinopril 10mg", "Metformin 1000mg"],
            "chronic_conditions": ["Type 2 Diabetes"],
            "allergies": []
        },
        ["Aspirin 500mg", "Spironolactone 25mg", "Ibuprofen 400mg"]
    )
    print(f"  has_warnings: {result4['has_warnings']}")
    print(f"  warning_count: {result4['warning_count']}")
    if result4['warnings']:
        print(f"  First warning: {result4['warnings'][0]}")
    
    # Maybe it's the order? Test with just Warfarin + Aspirin but multiple items
    print("\nTest: Same drugs but as lists with multiple items")
    result_multi = get_drug_interaction_warnings(
        {
            "medications": ["Warfarin 5mg daily", "Other meds"],
            "chronic_conditions": [],
            "allergies": []
        },
        ["Aspirin 500mg", "Other new drug"]
    )
    print(f"  has_warnings: {result_multi['has_warnings']}")
    print(f"  warning_count: {result_multi['warning_count']}")
    if result_multi['warnings']:
        print(f"  Warnings found: {len(result_multi['warnings'])}")

print("\n" + "="*70)
