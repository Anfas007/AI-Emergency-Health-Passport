# 🔒 Project Scope (Frozen)

## Project Title
AI Emergency Health Passport

## Objective
To provide rapid, secure, and privacy-preserving access to critical patient medical information during emergencies using QR-based access and AI-assisted triage, while ensuring patient consent and data control during normal medical consultations.

## Included Features

### Emergency Access
- QR-based emergency access without patient consent
- Time-limited emergency access (15–30 minutes)
- Read-only access to critical patient data
- Doctor enters live patient condition and vitals
- Full audit logging of emergency access

### Normal Consultation
- Doctor requests access using Patient ID
- Patient approves or rejects access
- Patient selects records and access duration
- Temporary consultation token with auto-expiry

### AI Emergency Intelligence
- Emergency severity prediction (Low / Medium / Critical)
- AI confidence score with low-confidence warning
- Possible medical condition prediction
- Immediate emergency action suggestions
- Emergency risk trend analysis
- Explainable AI using SHAP

### Privacy & Security
- Role-based access control
- JWT-based authentication
- Time-limited access tokens
- Mandatory doctor override reasoning
- Complete audit trail

### Platforms
- Mobile Application (Patient)
- Web Application (Doctor & Hospital)

## Explicitly Excluded
- Offline emergency QR
- Ambulance-side application
- Hospital cloud integrations
- National health ID integration
- Advanced DevOps automation

> This scope is finalized and frozen. No additional features will be added.
