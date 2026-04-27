# Backend Deployment Configuration

This directory contains the FastAPI backend for AI Emergency Health Passport, configured for Render.com deployment.

## Directory Structure

```
backend/
├── main.py                 # Entry point (imports from app.main)
├── requirements.txt        # Production dependencies
├── requirements-render.txt # Render-optimized dependencies
├── .env.example           # Environment variable template
├── app/
│   ├── main.py            # FastAPI application setup
│   ├── routes/            # API endpoint routers
│   │   ├── patient.py     # Patient records endpoints
│   │   ├── emergency.py   # Emergency access endpoints
│   │   ├── auth.py        # Authentication endpoints
│   │   └── hospital.py    # Hospital admin endpoints
│   ├── models/            # Pydantic request/response models
│   ├── services/          # Business logic services
│   │   ├── database.py    # MongoDB connection & collections
│   │   ├── auth_service.py   # JWT & password hashing
│   │   └── ...
│   └── ...
├── ai_engine/             # Rule-based AI modules
│   ├── ai_service.py      # AI orchestration
│   ├── drug_interaction_checker.py  # Drug interaction logic
│   └── ...
└── uploads/               # File storage for medical records (created on startup)
```

## Quick Start

### Local Development

```bash
# Install dependencies
pip install -r requirements.txt

# Create .env file from template
cp .env.example .env

# Edit .env with your MongoDB connection string
# MONGO_URL=mongodb+srv://username:password@cluster.mongodb.net/?retryWrites=true&w=majority

# Run backend
python main.py
# Or manually with uvicorn:
uvicorn main:app --reload --host 127.0.0.1 --port 8000
```

Visit: http://localhost:8000/docs (Swagger UI)

### Docker Development (Optional)

```bash
docker build -t health-passport-backend .
docker run -p 8000:8000 --env-file .env health-passport-backend
```

## Deployment to Render

### Prerequisites

1. **MongoDB Atlas** (free cluster available)
   - Create cluster at https://www.mongodb.com/cloud/atlas
   - Create database user
   - Configure IP whitelist (add Render IPs or 0.0.0.0/0)
   - Get connection string (SRV format)

2. **Render.com Account** (free tier available)
   - Sign up at https://render.com

3. **GitHub Repository**
   - Push this code to a GitHub repository
   - Render will auto-deploy on push to main branch

### Step 1: Set Up MongoDB

```bash
# 1. Create MongoDB Atlas cluster (free M0 tier)
# 2. Create database user
#    - Username: health_passport_admin
#    - Password: [generate strong password]
# 3. Configure IP whitelist
#    - Add: 0.0.0.0/0 (for development) or Render IPs (for production)
# 4. Get connection string
#    - Format: mongodb+srv://username:password@cluster.mongodb.net/?retryWrites=true&w=majority
```

### Step 2: Generate Secrets

```bash
# Generate JWT secret (copy the output)
python -c \"import secrets; print(secrets.token_urlsafe(32))\"
```

### Step 3: Deploy to Render

**Option A: Via GitHub (Recommended)**

1. Push code to GitHub
   ```bash
   git add .
   git commit -m \"Deploy to Render\"
   git push origin main
   ```

2. Go to [Render Dashboard](https://dashboard.render.com)
3. Click **New +** → **Web Service**
4. Click **Deploy existing repository** or **Connect GitHub repo**
5. Select your repository
6. Render will auto-detect `render.yaml`

**Option B: Via Render CLI**

```bash
npm install -g @render-oss/cli
render login
render deploy
```

### Step 4: Configure Environment Variables

In Render Dashboard → Environment:

```
MONGO_URL = mongodb+srv://username:password@cluster.mongodb.net/?retryWrites=true&w=majority
JWT_SECRET = [your-generated-secret]
MONGO_DB_NAME = ai_emergency_health_passport
CORS_ALLOW_ORIGINS = https://doctor-dashboard.onrender.com,https://hospital-dashboard.onrender.com
CORS_ALLOW_ORIGIN_REGEX = https://.*\.onrender\.com
DRUG_INTERACTION_DEBUG = false
```

**Important:** Mark `MONGO_URL` and `JWT_SECRET` as **Secret** (hidden in logs)

### Step 5: Verify Deployment

```bash
# Test health endpoint
curl https://your-service.onrender.com/health

# Should return:
# {
#   \"status\": \"OK\",
#   \"message\": \"Backend is running successfully\",
#   \"mongo_db\": \"ai_emergency_health_passport\"
# }
```

## Environment Variables

| Variable | Required | Example | Notes |
|----------|----------|---------|-------|
| `MONGO_URL` | Yes | `mongodb+srv://...` | MongoDB Atlas SRV connection string |
| `MONGO_DB_NAME` | No | `ai_emergency_health_passport` | Database name (default: ai_emergency_health_passport) |
| `JWT_SECRET` | Yes | `abc123...xyz789` | Secret for JWT signing (min 32 chars) |
| `CORS_ALLOW_ORIGINS` | No | `https://example.com` | Comma-separated list of allowed origins |
| `CORS_ALLOW_ORIGIN_REGEX` | No | `https://.*\.onrender\.com` | Regex pattern for CORS origins |
| `DRUG_INTERACTION_DEBUG` | No | `false` | Enable debug logging for drug checker |

## API Documentation

### Endpoints

**Health Check:**
- `GET /health` - Service health status

**Authentication:**
- `POST /auth/patient-signup` - Patient registration
- `POST /auth/patient-login` - Patient login
- `POST /hospital/signup` - Hospital admin registration
- `POST /hospital/login` - Hospital admin login

**Patient Records:**
- `GET /auth/patient-me` - Get current patient profile
- `GET /auth/patient-me/medical-summary` - Get AI-generated medical summary
- `POST /auth/patient-me/records` - Upload medical record

**Emergency Access:**
- `POST /emergency/access` - Request emergency access
- `GET /emergency/qr/{patient_id}` - Get emergency QR code

**Doctor:**
- `GET /patients/{patient_id}` - View patient records
- `POST /patients/consultation` - Save consultation

**Hospital:**
- `POST /hospital/departments` - Create department
- `POST /hospital/register-doctor` - Register doctor
- `GET /hospital/doctors` - List doctors

Full API documentation available at: `https://your-service.onrender.com/docs`

## Troubleshooting

### Build Fails

Check `render.yaml`:
```yaml
rootDir: backend
buildCommand: pip install --upgrade pip && pip install -r requirements.txt
startCommand: uvicorn main:app --host 0.0.0.0 --port $PORT
```

### MongoDB Connection Error

1. Verify `MONGO_URL` is set in Render environment
2. Check IP whitelist in MongoDB Atlas includes Render servers
3. Verify username/password in connection string

### Health Check Failing

1. Check MongoDB connection (see logs)
2. Verify environment variables are set
3. View logs: Render Dashboard → Logs tab

### CORS Errors

1. Add frontend URL to `CORS_ALLOW_ORIGINS`
2. Verify frontend uses correct backend URL

## Monitoring

### View Logs

```bash
# Render Dashboard → Service → Logs
# Or via CLI:
render logs -s your-service-name
```

### Health Checks

Render pings `/health` every 10 seconds. If it fails 3 times, service is marked unhealthy.

Monitor health:
```bash
watch curl https://your-service.onrender.com/health
```

## Production Checklist

- [ ] MongoDB Atlas cluster configured with backups
- [ ] MONGO_URL set as secret in Render
- [ ] JWT_SECRET set as secret in Render
- [ ] CORS_ALLOW_ORIGINS updated with frontend URLs
- [ ] Health endpoint responding (GET /health)
- [ ] API docs accessible (GET /docs)
- [ ] Database indexes created and verified
- [ ] Logs monitored for errors
- [ ] Auto-deploy on push enabled

## Resources

- [Render Documentation](https://render.com/docs)
- [FastAPI Production Guide](https://fastapi.tiangolo.com/deployment/)
- [MongoDB Atlas Documentation](https://www.mongodb.com/docs/atlas/)
- [Uvicorn Configuration](https://www.uvicorn.org/)

## Support

For deployment issues, check:
1. Render logs (Render Dashboard → Logs)
2. MongoDB Atlas logs
3. Environment variables
4. This README and DEPLOYMENT.md guide
