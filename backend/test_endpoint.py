#!/usr/bin/env python3
"""Test the drug interaction endpoint."""

import sys
from pathlib import Path
import requests
import json
from datetime import datetime, timedelta
import jwt

sys.path.insert(0, str(Path(__file__).parent))

# Get JWT secret
from dotenv import load_dotenv
import os

for candidate in (Path(__file__).parent / ".env.local", Path(__file__).parent / ".env"):
    if candidate.exists():
        load_dotenv(candidate)
        break

JWT_SECRET = os.getenv("JWT_SECRET", "default-secret")

# Create a valid JWT token for a test doctor
payload = {
    "doctor_id": "DOC-100",
    "name": "Dr. John Smith",
    "hospital_code": "HOSP-000",
    "hospital_name": "City Hospital",
    "exp": datetime.utcnow() + timedelta(hours=1)
}
token = jwt.encode(payload, JWT_SECRET, algorithm="HS256")

print("\n" + "="*70)
print("🧪 TESTING DRUG INTERACTION ENDPOINT")
print("="*70)

BASE_URL = "http://127.0.0.1:8000"
headers = {
    "Content-Type": "application/json",
    "Authorization": f"Bearer {token}"
}

# Test Case 1: Single prescription
print("\n" + "-"*70)
print("Test 1: Warfarin (existing) + Aspirin (new) = HIGH interaction")
print("-"*70)

data1 = {
    "prescribed_drugs": ["Aspirin 500mg"],
    "existing_medications": ["Warfarin 5mg"]
}

try:
    response1 = requests.post(
        f"{BASE_URL}/patients/check-drug-interactions/HP-7811-8115",
        headers=headers,
        json=data1,
        timeout=5
    )
    print(f"Status: {response1.status_code}")
    result1 = response1.json()
    print(f"Has warnings: {result1.get('has_warnings')}")
    print(f"Warning count: {result1.get('warning_count')}")
    if result1.get('warnings'):
        print(f"Warnings:")
        for w in result1['warnings']:
            print(f"  - {w['drug_a'].title()} + {w['drug_b'].title()}: {w['severity'].upper()}")
            print(f"    Risk: {w['risk']}")
            print(f"    Recommendation: {w['recommendation']}")
except Exception as e:
    print(f"Error: {e}")

# Test Case 2: Multiple prescriptions
print("\n" + "-"*70)
print("Test 2: Multiple interactions check")
print("-"*70)

data2 = {
    "prescribed_drugs": ["Aspirin 500mg", "Spironolactone 25mg"],
    "existing_medications": ["Warfarin 5mg", "Lisinopril 10mg"]
}

try:
    response2 = requests.post(
        f"{BASE_URL}/patients/check-drug-interactions/HP-7811-8115",
        headers=headers,
        json=data2,
        timeout=5
    )
    print(f"Status: {response2.status_code}")
    result2 = response2.json()
    print(f"Has warnings: {result2.get('has_warnings')}")
    print(f"Warning count: {result2.get('warning_count')}")
    if result2.get('warnings'):
        print(f"Warnings:")
        for i, w in enumerate(result2['warnings'], 1):
            print(f"  {i}. {w['drug_a'].title()} + {w['drug_b'].title()}: {w['severity'].upper()}")
except Exception as e:
    print(f"Error: {e}")

# Test Case 3: No interactions
print("\n" + "-"*70)
print("Test 3: No interactions expected")
print("-"*70)

data3 = {
    "prescribed_drugs": ["Multivitamin"],
    "existing_medications": ["Vitamin D", "Calcium"]
}

try:
    response3 = requests.post(
        f"{BASE_URL}/patients/check-drug-interactions/HP-7811-8115",
        headers=headers,
        json=data3,
        timeout=5
    )
    print(f"Status: {response3.status_code}")
    result3 = response3.json()
    print(f"Has warnings: {result3.get('has_warnings')}")
    print(f"Warning count: {result3.get('warning_count')}")
    if not result3.get('warnings'):
        print("✅ Correct: No warnings found")
except Exception as e:
    print(f"Error: {e}")

print("\n" + "="*70)
print("✅ ENDPOINT TEST COMPLETE")
print("="*70)
