from app.services.token_service import generate_emergency_token
from app.services.emergency_store import save_token, validate_token

if __name__ == '__main__':
    token, expires = generate_emergency_token(minutes=1)
    save_token(token, 'test-patient-123', expires, 'doctor')
    print('Saved token:', token)
    print('Validate result:', validate_token(token))
