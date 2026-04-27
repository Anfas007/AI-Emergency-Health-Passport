from pymongo import MongoClient
from pymongo.errors import ConnectionFailure, ServerSelectionTimeoutError
from dotenv import load_dotenv
import os
import sys

# ──────────────────────────────────────────────────────────────────────
# ENVIRONMENT CONFIGURATION FOR LOCAL & RENDER DEPLOYMENT
# ──────────────────────────────────────────────────────────────────────

# Load .env file from backend directory (only in local development)
# In production (Render), environment variables come from Render dashboard
BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "../.."))
ENV_PATH = os.path.join(BASE_DIR, ".env")

# load_dotenv is safe even if .env doesn't exist (production scenario)
# On Render, .env won't exist and vars come from environment
if os.path.exists(ENV_PATH):
    load_dotenv(dotenv_path=ENV_PATH)
    print(f"[startup] Loaded .env from local file: {ENV_PATH}")
else:
    # In production on Render, .env won't exist - use environment vars
    load_dotenv()  # Load from system environment
    print("[startup] .env file not found; using Render environment variables")

# ──────────────────────────────────────────────────────────────────────
# MONGODB CONNECTION SETUP
# ──────────────────────────────────────────────────────────────────────

MONGO_URL = os.getenv("MONGO_URL")
MONGO_DB_NAME = os.getenv("MONGO_DB_NAME", "ai_emergency_health_passport").strip()

# Validate required environment variables
if not MONGO_URL:
    error_msg = (
        "❌ MONGO_URL not set!\n"
        "   Local development: Create backend/.env with MONGO_URL=...\n"
        "   Render deployment: Set MONGO_URL in Render dashboard → Environment tab\n"
        "   MongoDB Atlas: https://www.mongodb.com/cloud/atlas"
    )
    print(error_msg, file=sys.stderr)
    raise RuntimeError(error_msg)

# Connect to MongoDB with error handling
try:
    # serverSelectionTimeoutMS=5000 waits 5 seconds for initial connection
    # This prevents long hangs during startup if MongoDB is unavailable
    client = MongoClient(
        MONGO_URL,
        serverSelectionTimeoutMS=5000,
        connectTimeoutMS=10000,
        retryWrites=True
    )
    
    # Force connection attempt immediately to catch errors early
    client.admin.command("ping")
    db = client[MONGO_DB_NAME]
    
    print(f"[startup] ✅ MongoDB connected successfully")
    print(f"[startup] 📊 Database: {db.name}")
    print(f"[startup] 🔗 Connection string: {MONGO_URL[:50]}...")
    
except (ConnectionFailure, ServerSelectionTimeoutError) as e:
    error_msg = (
        f"❌ MongoDB connection failed: {str(e)}\n"
        "   Check that:\n"
        "   1. MONGO_URL is correct\n"
        "   2. MongoDB Atlas cluster is running\n"
        "   3. IP whitelist includes Render server (or 0.0.0.0/0)\n"
        "   4. Database name in MONGO_URL matches cluster"
    )
    print(error_msg, file=sys.stderr)
    raise RuntimeError(error_msg) from e

except Exception as e:
    error_msg = f"❌ Unexpected MongoDB error: {str(e)}"
    print(error_msg, file=sys.stderr)
    raise RuntimeError(error_msg) from e

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