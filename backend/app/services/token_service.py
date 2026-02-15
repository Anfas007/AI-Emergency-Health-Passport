import uuid
from datetime import datetime, timedelta

def generate_emergency_token(minutes=10):
    token = str(uuid.uuid4())
    expires_at = datetime.utcnow() + timedelta(minutes=minutes)
    return token, expires_at
