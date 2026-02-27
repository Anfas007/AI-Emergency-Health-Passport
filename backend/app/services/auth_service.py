import jwt
import bcrypt
import os
from datetime import datetime, timedelta
from fastapi import HTTPException, Security
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

# ── Config ──
SECRET_KEY = os.getenv("JWT_SECRET", "ai-ehp-secret-key-change-in-production")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 8  # 8-hour session

security_scheme = HTTPBearer()


# ── Password hashing ──

def hash_password(password: str) -> str:
    """Hash password using bcrypt with auto-generated salt."""
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def verify_password(plain: str, hashed: str) -> bool:
    """Verify a plain password against a bcrypt hash."""
    return bcrypt.checkpw(plain.encode("utf-8"), hashed.encode("utf-8"))


# ── JWT tokens ──

def create_access_token(data: dict, expires_minutes: int = ACCESS_TOKEN_EXPIRE_MINUTES) -> str:
    """Create a signed JWT access token."""
    payload = data.copy()
    payload["exp"] = datetime.utcnow() + timedelta(minutes=expires_minutes)
    payload["iat"] = datetime.utcnow()
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)


def decode_access_token(token: str) -> dict:
    """Decode and verify a JWT token. Raises HTTPException on failure."""
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token has expired. Please login again.")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token. Please login again.")


# ── FastAPI dependency ──

def get_current_doctor(credentials: HTTPAuthorizationCredentials = Security(security_scheme)) -> dict:
    """
    FastAPI dependency – extracts and validates the JWT from the
    Authorization: Bearer <token> header.
    Returns the decoded doctor payload.
    """
    token = credentials.credentials
    return decode_access_token(token)


def get_current_doctor_with_hospital(credentials: HTTPAuthorizationCredentials = Security(security_scheme)) -> dict:
    """
    FastAPI dependency – same as get_current_doctor but also verifies that
    an active hospital_code is present in the JWT.  Raises 403 if the doctor
    has not selected a hospital for this session.
    """
    token = credentials.credentials
    payload = decode_access_token(token)
    if not payload.get("hospital_code"):
        raise HTTPException(
            status_code=403,
            detail="No active hospital selected. Please select a hospital first.",
        )
    return payload
