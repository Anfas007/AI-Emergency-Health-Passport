from pymongo import MongoClient
import os

MONGO_URL = os.getenv("MONGO_URL", "mongodb://localhost:27017")
MONGO_DB_NAME = os.getenv("MONGO_DB_NAME", "").strip()

client = MongoClient(MONGO_URL)

if MONGO_DB_NAME:
    db = client[MONGO_DB_NAME]
else:
    # Respect database name from Mongo URI when present.
    try:
        default_db = client.get_default_database()
    except Exception:
        default_db = None

    if default_db is not None:
        db = default_db
    else:
        db = client["ai_emergency_health_passport"]

print(f"[startup] Mongo database selected: {db.name}")

patients_collection = db["patients"]
doctor_decisions_collection = db["doctor_decisions"]
doctor_notes_collection = db["doctor_notes"]
audit_logs_collection = db["audit_logs"]
emergency_sessions_collection = db["emergency_sessions"]
doctors_collection = db["doctors"]
patient_accounts_collection = db["patient_accounts"]
# Collection for storing short-lived emergency tokens (QR access)
emergency_tokens_collection = db["emergency_tokens"]
# Collection for tracking auto-shared access (AI CRITICAL → hospital)
shared_access_collection = db["shared_access"]
# Collections for consent management
consent_collection = db["consent"]
consent_requests_collection = db["consent_requests"]
# Hospital dashboard collections
hospital_admins_collection = db["hospital_admins"]
departments_collection = db["departments"]
# Doctor–Hospital associations (RBAC)
doctor_hospital_associations_collection = db["doctor_hospital_associations"]
# Normal consultation records
consultations_collection = db["consultations"]
# Patient notifications
patient_notifications_collection = db["patient_notifications"]


def ensure_indexes():
    """Create TTL and other indexes. Safe to call on every startup."""
    # Unique patient email for patient-auth signup/login
    patient_accounts_collection.create_index(
        "email", unique=True, name="uniq_patient_email"
    )
    # Auto-delete expired emergency tokens
    emergency_tokens_collection.create_index(
        "expires_at", expireAfterSeconds=0, name="ttl_expires_at"
    )
    # Auto-delete expired shared-access records
    shared_access_collection.create_index(
        "expires_at", expireAfterSeconds=0, name="ttl_shared_expires_at"
    )
    # Optionally expire consent requests after 30 days
    consent_requests_collection.create_index("created_at", expireAfterSeconds=60 * 60 * 24 * 30, name="ttl_consent_requests")
    # Expire consent records when their expires_at passes (if provided)
    consent_collection.create_index("expires_at", expireAfterSeconds=0, name="ttl_consent_expires_at")
    # Doctor–Hospital association indexes for fast lookups
    doctor_hospital_associations_collection.create_index(
        [("doctor_id", 1), ("hospital_code", 1), ("status", 1)],
        name="idx_assoc_doctor_hospital_status",
    )
    doctor_hospital_associations_collection.create_index(
        [("hospital_code", 1), ("status", 1)],
        name="idx_assoc_hospital_status",
    )
