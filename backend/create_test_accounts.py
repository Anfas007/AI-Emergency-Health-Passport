#!/usr/bin/env python3
"""Create test accounts with photos for local development."""

import os
import sys
from pathlib import Path
from datetime import datetime
import uuid

# Add parent to path
sys.path.insert(0, str(Path(__file__).parent))

from dotenv import load_dotenv
from app.services.auth_service import hash_password
from app.services.database import doctors_collection, hospital_admins_collection

# Load environment
for candidate in (Path(__file__).parent / ".env.local", Path(__file__).parent / ".env"):
    if candidate.exists():
        load_dotenv(candidate)
        print(f"✅ Loaded environment from {candidate.name}")
        break

def create_placeholder_avatar(name: str, color_hex: str = "3498DB") -> str:
    """
    Create a simple SVG placeholder avatar with initials.
    Returns the data URL.
    """
    # Get initials
    initials = "".join([word[0].upper() for word in name.split() if word])[:2]
    if not initials:
        initials = "U"
    
    # Create SVG
    svg = f'''<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200">
        <rect width="200" height="200" fill="#{color_hex}"/>
        <text x="100" y="115" font-size="80" font-weight="bold" fill="white" text-anchor="middle" font-family="Arial">{initials}</text>
    </svg>'''
    
    # Convert to data URL
    import base64
    svg_bytes = svg.encode('utf-8')
    b64 = base64.b64encode(svg_bytes).decode('utf-8')
    return f"data:image/svg+xml;base64,{b64}"

# Test Accounts with photos
TEST_HOSPITAL_ADMIN = {
    "admin_id": f"ADMIN-{uuid.uuid4().hex[:8].upper()}",
    "name": "Test Hospital Admin",
    "email": "admin@hospital.com",
    "password": hash_password("admin123"),  # Password: admin123
    "hospital_code": "TEST-HOSP-001",
    "hospital_name": "Test Hospital",
    "role": "hospital_admin",
    "photo_url": create_placeholder_avatar("Test Hospital Admin", "2E7D32"),  # Green
    "created_at": datetime.utcnow().isoformat(),
}

TEST_DOCTOR = {
    "doctor_id": f"DOC-{uuid.uuid4().hex[:8].upper()}",
    "name": "Test Doctor",
    "email": "doctor@test.com",
    "password": hash_password("doctor123"),  # Password: doctor123
    "specialization": "Emergency Medicine",
    "hospital_code": "TEST-HOSP-001",
    "role_level": "doctor",
    "photo_url": create_placeholder_avatar("Test Doctor", "1967D2"),  # Blue
    "created_at": datetime.utcnow().isoformat(),
}

def create_test_accounts():
    """Create or update test accounts in database with photos."""
    print("\n" + "="*60)
    print("🔧 CREATE TEST ACCOUNTS WITH PHOTOS")
    print("="*60)

    # Hospital Admin
    print("\n👨‍💼 Hospital Admin Account:")
    print(f"  Email:    {TEST_HOSPITAL_ADMIN['email']}")
    print(f"  Password: admin123")
    print(f"  Photo:    ✅ Avatar generated")
    
    existing_admin = hospital_admins_collection.find_one({"email": TEST_HOSPITAL_ADMIN['email']})
    if existing_admin:
        print(f"  Status:   ✏️  EXISTS - Updating...")
        hospital_admins_collection.update_one(
            {"email": TEST_HOSPITAL_ADMIN['email']},
            {"$set": TEST_HOSPITAL_ADMIN}
        )
    else:
        print(f"  Status:   ✨ CREATED")
        hospital_admins_collection.insert_one(TEST_HOSPITAL_ADMIN)

    # Doctor
    print("\n👨‍⚕️  Doctor Account:")
    print(f"  Email:    {TEST_DOCTOR['email']}")
    print(f"  Password: doctor123")
    print(f"  Photo:    ✅ Avatar generated")
    
    existing_doctor = doctors_collection.find_one({"email": TEST_DOCTOR['email']})
    if existing_doctor:
        print(f"  Status:   ✏️  EXISTS - Updating...")
        doctors_collection.update_one(
            {"email": TEST_DOCTOR['email']},
            {"$set": TEST_DOCTOR}
        )
    else:
        print(f"  Status:   ✨ CREATED")
        doctors_collection.insert_one(TEST_DOCTOR)

    print("\n" + "="*60)
    print("✅ Test accounts with photos created successfully!")
    print("="*60)
    print("\n🔗 Login URLs:")
    print("  Doctor Dashboard:    http://localhost:3000")
    print("  Hospital Dashboard:  http://localhost:3002")
    print("\n")

if __name__ == "__main__":
    try:
        create_test_accounts()
    except Exception as e:
        print(f"\n❌ Error: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
