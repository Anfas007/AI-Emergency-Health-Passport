# Backend Deployment Guide

This file explains how to put the backend online in simple steps.

## What This Backend Is

The backend is the server that stores patient data, checks logins, handles emergency access, and connects the mobile app and dashboards to the database.

## What You Need

- A MongoDB Atlas database
- A Render account, if you want to host it online
- The project code in GitHub
- Two secrets: `MONGO_URL` and `JWT_SECRET`

## Run It Locally

```bash
pip install -r requirements.txt
copy .env.example .env
python main.py
```

After it starts, open `http://localhost:8000/docs` in your browser to see the API.

## Put It On Render

1. Create your MongoDB Atlas database.
2. Copy the connection string and save it as `MONGO_URL`.
3. Generate a strong `JWT_SECRET`.
4. Push the code to GitHub.
5. Create a new Render web service from the repository.
6. Add the environment variables in Render.
7. Check `https://your-service.onrender.com/health` after deployment.

## Important Environment Variables

- `MONGO_URL` - database connection string
- `JWT_SECRET` - secret used for login tokens
- `MONGO_DB_NAME` - database name
- `CORS_ALLOW_ORIGINS` - allowed frontend URLs
- `DRUG_INTERACTION_DEBUG` - turns debug logging on or off

## Common Problems

- If the app cannot connect to MongoDB, check the connection string and IP settings in Atlas.
- If the health check fails, check Render logs first.
- If the dashboard cannot talk to the backend, check the CORS settings.

## Where To Look Next

- `README.md` for the plain-language project overview
- `render.yaml` for deployment settings
- `backend/app/main.py` for backend startup behavior
- `backend/app/services/database.py` for database connection logic
