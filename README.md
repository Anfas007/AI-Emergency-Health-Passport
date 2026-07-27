# AI Emergency Health Passport

AI Emergency Health Passport is a system that helps doctors, hospitals, and patients share critical health information quickly and safely. In an emergency, it can show the right patient details fast. In normal use, it helps patients manage records and lets healthcare staff review information with consent.

## Simple Overview

Think of it as three connected parts working together:

- A mobile app for patients
- A web dashboard for doctors
- A web dashboard for hospital staff
- A FastAPI backend that connects everything and talks to the database

The system also uses AI helpers to summarize medical information, check allergy risks, and warn about possible drug interactions.

## Who Uses It

- Patients use the mobile app to register, view records, and manage their health information.
- Doctors use the doctor dashboard to review patient details and support consultations.
- Hospital staff use the hospital dashboard to manage doctors and system records.
- The backend handles login, data storage, emergency access, and AI-powered checks.

## What The System Can Do

- Show emergency health information using QR-based access
- Let patients register and keep their medical details updated
- Store uploaded medical records
- Generate medical summaries for quicker understanding
- Check for allergy risk and drug interactions
- Support doctor and hospital workflows
- Keep the system running locally, in Docker, or on Render

## Project Structure

- `backend/` - FastAPI backend, database code, AI services, and deployment notes
- `mobile_app/` - Flutter app used by patients
- `web-app/doctor-dashboard/` - Doctor web dashboard
- `web-app/hospital-dashboard/` - Hospital staff web dashboard
- `docs/` - Project documentation in plain language and analysis format
- `render.yaml`, `railway.toml`, `docker-compose.yml` - Deployment and local setup files

## If You Just Want To Understand The Project

1. Start with the sections above.
2. Then read the short feature and folder descriptions in this README.
3. If you want deeper background, open the files in `docs/`.

## If You Want To Run It Locally

Backend:

```bash
cd backend
pip install -r requirements.txt
python main.py
```

The backend usually runs at `http://localhost:8000`. It also provides API docs at `/docs` and a health check at `/health`.

Mobile app:

```bash
cd mobile_app
flutter pub get
flutter run --dart-define=API_BASE_URL=http://<your-backend-ip>:8000
```

Use your computer IP instead of `localhost` if you are testing on a real phone.

Web dashboards:

Open the relevant folder in `web-app/` and run it with that app's usual start command.

## Deployment In Plain Words

If you want to put the backend online, you will usually need:

- A Render account or another hosting service
- A MongoDB Atlas database
- Environment variables like `MONGO_URL` and `JWT_SECRET`

For backend deployment details, use `backend/README_DEPLOYMENT.md`.

## Where To Find More Details

- `docs/Scope_and_Features.md`
- `docs/Actors_and_Use_Cases.md`
- `docs/Problem_Statement.md`
- `docs/Access_Flow_Comparison.md`
- `backend/README_DEPLOYMENT.md`

## Notes

- Do not commit generated folders like backend virtual environments or Flutter build outputs.
- If you add a new app, dashboard, or service, update this README so it stays useful for non-technical readers.
