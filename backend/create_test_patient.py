#!/usr/bin/env python3
"""Create a test patient account for emergency consultation testing."""

import os
import sys
from pathlib import Path
from datetime import datetime
import uuid
import base64

# Add parent to path
sys.path.insert(0, str(Path(__file__).parent))

from dotenv import load_dotenv
from app.services.auth_service import hash_password
from app.services.database import patient_accounts_collection, patients_collection
from app.services.patient_id_generator import generate_patient_id

# Load environment
for candidate in (Path(__file__).parent / ".env.local", Path(__file__).parent / ".env"):
    if candidate.exists():
        load_dotenv(candidate)
        print(f"✅ Loaded environment from {candidate.name}")
        break

def create_svg_avatar(name: str, color_hex: str = "E91E63") -> str:
    """Create a simple SVG avatar with initials as data URL."""
    initials = "".join([word[0].upper() for word in name.split() if word])[:2]
    if not initials:
        initials = "P"
    
    svg = f'''<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200">
        <rect width="200" height="200" fill="#{color_hex}"/>
        <text x="100" y="115" font-size="80" font-weight="bold" fill="white" text-anchor="middle" font-family="Arial">{initials}</text>
    </svg>'''
    
    svg_bytes = svg.encode('utf-8')
    b64 = base64.b64encode(svg_bytes).decode('utf-8')
    return f"data:image/svg+xml;base64,{b64}"

def create_test_patient():
    """Create a test patient account for emergency consultation."""
    print("\n" + "="*60)
    print("👤 CREATE TEST PATIENT FOR EMERGENCY CONSULTATION")
    print("="*60)
    
    patient_id = generate_patient_id()
    photo_url = create_svg_avatar("John Doe", "E91E63")  # Pink
    
    # Patient Account (for login)
    account = {
        "patient_id": patient_id,
        "name": "John Doe",
        "email": "patient@test.com",
        "password": hash_password("patient123"),
        "age": 35,
        "dob": "1989-05-15",
        "gender": "Male",
        "blood_group": "O+",
        "phone": "+1-555-0123",
        "emergency_contact": "Jane Doe",
        "emergency_contact_phone": "+1-555-0124",
        "photo_url": photo_url,
        "created_at": datetime.utcnow().isoformat(),
    }
    
    # Patient Medical Profile (for emergency access)
    medical_profile = {
        "patient_id": patient_id,
        "name": "John Doe",
        "age": 35,
        "gender": "Male",
        "blood_group": "O+",
        "phone": "+1-555-0123",
        "emergency_contact": "Jane Doe",
        "emergency_contact_phone": "+1-555-0124",
        "email": "patient@test.com",
        "photo_url": photo_url,
        "emergency_contact_name": "Jane Doe",
        "allergies": ["Penicillin", "Sulfonamides"],
        "chronic_conditions": ["Hypertension", "Type 2 Diabetes"],
        "past_diagnoses": ["Migraine", "Anxiety Disorder"],
        "medications": [
            "Lisinopril 10mg daily",
            "Metformin 1000mg twice daily",
            "Aspirin 81mg daily",
            "Atorvastatin 20mg daily"
        ],
        "created_at": datetime.utcnow().isoformat(),
    }
    
    # Insert or update
    print(f"\n📋 Patient Account:")
    print(f"  Patient ID:     {patient_id}")
    print(f"  Name:           {account['name']}")
    print(f"  Email:          {account['email']}")
    print(f"  Password:       patient123")
    print(f"  Blood Group:    {account['blood_group']}")
    print(f"  Age:            {account['age']}")
    print(f"  Photo:          ✅ Avatar generated")
    
    existing = patient_accounts_collection.find_one({"email": "patient@test.com"})
    if existing:
        print(f"  Status:         ✏️  EXISTS - Updating...")
        patient_accounts_collection.update_one(
            {"email": "patient@test.com"},
            {"$set": account}
        )
        patients_collection.update_one(
            {"patient_id": existing["patient_id"]},
            {"$set": medical_profile},
            upsert=True
        )
    else:
        print(f"  Status:         ✨ CREATED")
        patient_accounts_collection.insert_one(account)
        patients_collection.insert_one(medical_profile)
    
    print(f"\n📋 Medical Information:")
    print(f"  Allergies:      {', '.join(medical_profile['allergies'])}")
    print(f"  Conditions:     {', '.join(medical_profile['chronic_conditions'])}")
    print(f"  Medications:    {len(medical_profile['medications'])} active")
    
    print("\n" + "="*60)
    print("✅ Test patient created successfully!")
    print("="*60)
    print("\n🔗 Test the Emergency Consultation:")
    print(f"  URL:        http://localhost:3000/emergency")
    print(f"  Patient ID: {patient_id}")
    print(f"  Scan QR or enter patient ID to see the photo")
    print("\n")

if __name__ == "__main__":
    try:
        create_test_patient()
    except Exception as e:
        print(f"\n❌ Error: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
