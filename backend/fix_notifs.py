import uuid
import datetime
from app.services.database import consent_requests_collection, patient_notifications_collection

reqs = list(consent_requests_collection.find({'status':'requested'}))
inserted = 0

for r in reqs:
    rid = r.get('request_id')
    pid = r.get('patient_id')
    doctor = r.get('requested_by', 'Doctor')
    
    exists = patient_notifications_collection.find_one({'request_id': rid})
    if not exists:
        n = {
            'notification_id': f'N-{uuid.uuid4().hex[:8].upper()}',
            'patient_id': pid,
            'type': 'consent_request',
            'message': f'Dr. {doctor} requested consent for normal consultation ({rid}).',
            'request_id': rid,
            'hospital_code': r.get('hospital_code', ''),
            'hospital_name': r.get('hospital_name', ''),
            'read': False,
            'created_at': datetime.datetime.utcnow().isoformat()
        }
        patient_notifications_collection.insert_one(n)
        inserted += 1

print("Added backwards-compatible notifications:", inserted)
