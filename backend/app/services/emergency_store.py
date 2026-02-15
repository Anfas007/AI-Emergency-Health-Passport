from datetime import datetime

# temporary in-memory store (OK for project demo)
emergency_tokens = {}

def save_token(token, patient_id, expires_at, role):
    emergency_tokens[token] = {
        "patient_id": patient_id,
        "expires_at": expires_at,
        "role": role
    }

def validate_token(token):
    data = emergency_tokens.get(token)

    if not data:
        return None

    if datetime.utcnow() > data["expires_at"]:
        emergency_tokens.pop(token)
        return None

    return data
