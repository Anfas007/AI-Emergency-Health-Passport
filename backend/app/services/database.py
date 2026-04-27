from pymongo import MongoClient
from dotenv import load_dotenv
import os

# Force load backend/.env
BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "../.."))
ENV_PATH = os.path.join(BASE_DIR, ".env")
load_dotenv(dotenv_path=ENV_PATH)

MONGO_URL = os.getenv("MONGO_URL")
MONGO_DB_NAME = os.getenv("MONGO_DB_NAME", "ai_emergency_health_passport").strip()

if not MONGO_URL:
    raise RuntimeError("MONGO_URL not found. Check backend/.env file.")

client = MongoClient(MONGO_URL)
db = client[MONGO_DB_NAME]

print(f"[startup] Loaded .env from: {ENV_PATH}")
print(f"[startup] Mongo URL: {MONGO_URL[:30]}...")
print(f"[startup] Mongo database selected: {db.name}")

patients_collection = db["patients"]
doctor_decisions_collection = db["doctor_decisions"]
doctor_notes_collection = db["doctor_notes"]
audit_logs_collection = db["audit_logs"]
emergency_sessions_collection = db["emergency_sessions"]
doctors_collection = db["doctors"]
patient_accounts_collection = db["patient_accounts"]

emergency_tokens_collection = db["emergency_tokens"]
shared_access_collection = db["shared_access"]

consent_collection = db["consent"]
consent_requests_collection = db["consent_requests"]

hospital_admins_collection = db["hospital_admins"]
departments_collection = db["departments"]

doctor_hospital_associations_collection = db["doctor_hospital_associations"]

consultations_collection = db["consultations"]

patient_notifications_collection = db["patient_notifications"]


def ensure_indexes():
    """Create TTL and other indexes. Safe to call on every startup."""

    patient_accounts_collection.create_index(
        "email",
        unique=True,
        name="uniq_patient_email"
    )

    emergency_tokens_collection.create_index(
        "expires_at",
        expireAfterSeconds=0,
        name="ttl_expires_at"
    )

    shared_access_collection.create_index(
        "expires_at",
        expireAfterSeconds=0,
        name="ttl_shared_expires_at"
    )

    consent_requests_collection.create_index(
        "created_at",
        expireAfterSeconds=60 * 60 * 24 * 30,
        name="ttl_consent_requests"
    )

    consent_collection.create_index(
        "expires_at",
        expireAfterSeconds=0,
        name="ttl_consent_expires_at"
    )

    doctor_hospital_associations_collection.create_index(
        [("doctor_id", 1), ("hospital_code", 1), ("status", 1)],
        name="idx_assoc_doctor_hospital_status"
    )

    doctor_hospital_associations_collection.create_index(
        [("hospital_code", 1), ("status", 1)],
        name="idx_assoc_hospital_status"
    )