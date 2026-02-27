from datetime import datetime
from app.services.database import emergency_tokens_collection


def save_token(token, patient_id, expires_at, role):
    """Persist an emergency token in MongoDB.

    Document structure:
      { token, patient_id, expires_at: datetime, role }
    """
    doc = {
        "token": token,
        "patient_id": patient_id,
        "expires_at": expires_at,
        "role": role,
        "created_at": datetime.utcnow()
    }
    emergency_tokens_collection.insert_one(doc)


def validate_token(token):
    """Validate token and return token data or None if invalid/expired."""
    data = emergency_tokens_collection.find_one({"token": token}, {"_id": 0})

    if not data:
        return None

    if datetime.utcnow() > data.get("expires_at"):
        # remove expired token
        emergency_tokens_collection.delete_one({"token": token})
        return None

    return data
