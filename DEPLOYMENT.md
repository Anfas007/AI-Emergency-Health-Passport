# Render.com Deployment Guide
# AI Emergency Health Passport Backend

This guide walks you through deploying the FastAPI backend to Render.com with MongoDB Atlas.

---

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [MongoDB Atlas Setup](#mongodb-atlas-setup)
3. [Prepare for Deployment](#prepare-for-deployment)
4. [Deploy to Render](#deploy-to-render)
5. [Post-Deployment Configuration](#post-deployment-configuration)
6. [Troubleshooting](#troubleshooting)

---

## Prerequisites

- [Render.com account](https://render.com/register) (free tier available)
- [MongoDB Atlas account](https://www.mongodb.com/cloud/atlas) (free tier available)
- Git repository with backend code
- GitHub account (for auto-deploy on push)

---

## MongoDB Atlas Setup

### Step 1: Create MongoDB Atlas Cluster

1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Sign up or log in
3. Create a new project:
   - Click \"New Project\"
   - Name: \"AI Emergency Health Passport\"
   - Click \"Create Project\"

4. Create a cluster:
   - Click \"Create\" (or \"Build a Database\")
   - Choose \"Shared\" (Free tier)
   - Select region closest to you
   - Cluster tier: \"M0 (Shared)\"
   - Click \"Create Cluster\"
   - Wait 2-5 minutes for cluster creation

### Step 2: Create Database User

1. In MongoDB Atlas, go to **Database Access**
2. Click **Add New Database User**
   - Authentication Method: **Password**
   - Username: `health_passport_admin` (or any name)
   - Password: Generate auto or create strong password
   - Copy the password somewhere safe
   - Database User Privileges: **Built-in Role: Atlas admin**
   - Click **Add User**

### Step 3: Configure IP Whitelist

1. Go to **Network Access**
2. Click **Add IP Address**
3. For testing/development:
   - IP Address: `0.0.0.0/0` (Allow all - less secure)
   - Comment: \"Render deployment + dev\"
4. For production:
   - Add Render server IP (provided by Render after deployment)
   - Never use 0.0.0.0/0 in production
5. Click **Confirm**

### Step 4: Get Connection String

1. Go to **Clusters** view
2. Click **Connect** button
3. Choose **Drivers** connection method
4. Select Python 3.11+
5. Copy the connection string:
   ```
   mongodb+srv://username:password@cluster-name.mongodb.net/?retryWrites=true&w=majority
   ```
6. Replace `<username>` with your username and `<password>` with your password
7. Keep this safe - you'll use it as MONGO_URL

**Example:**
```
mongodb+srv://health_passport_admin:MySecurePass123@health-cluster-abc.mongodb.net/?retryWrites=true&w=majority
```

---

## Prepare for Deployment

### Step 1: Generate JWT Secret

Run this command to generate a secure JWT secret:

```bash
python -c \"import secrets; print(secrets.token_urlsafe(32))\"
```

Example output:
```
abc123def456_GhIjKlMnOpQrStUvWxYz1A2B3C4D5E6F
```

Save this value - you'll set it as JWT_SECRET in Render.

### Step 2: Update .env.example (Optional)

File: `backend/.env.example`

This file documents required environment variables. It's for reference only - not used in Render deployment.

### Step 3: Verify Requirements File

Ensure file exists: `backend/requirements-render.txt`

This contains only essential dependencies optimized for Render.
If using the standard `requirements.txt`, ensure it has:
- fastapi
- uvicorn[standard]
- pymongo
- python-dotenv
- dnspython
- PyJWT
- bcrypt
- python-multipart

### Step 4: Check render.yaml

File: `render.yaml` (in project root)

Verify these critical fields:

```yaml
buildCommand: pip install --upgrade pip && pip install -r requirements.txt
startCommand: uvicorn main:app --host 0.0.0.0 --port $PORT
rootDir: backend
```

---

## Deploy to Render

### Option A: Deploy via GitHub (Recommended)

1. **Push code to GitHub**
   ```bash
   git add .
   git commit -m \"Prepare for Render deployment\"
   git push origin main
   ```

2. **Connect GitHub to Render**
   - Go to [Render Dashboard](https://dashboard.render.com)
   - Click **New +** → **Web Service**
   - Click **Deploy existing repository**
   - Or click **Connect a GitHub repo**
   - Select your repository
   - Click **Connect**

3. **Configure Service**
   - **Name:** `ai-emergency-health-passport-backend`
   - **Environment:** Python
   - **Region:** Same as your MongoDB Atlas region
   - **Plan:** Free (upgradable to standard)
   - Other settings from `render.yaml` auto-import
   - Click **Create Web Service**

4. **Render will start building**
   - Takes 5-10 minutes for initial build
   - Watch the deployment logs
   - Look for: \"[startup] ✅ MongoDB connected successfully\"

### Option B: Manual Deployment via CLI

1. **Install Render CLI**
   ```bash
   npm install -g @render-oss/cli
   ```

2. **Authenticate**
   ```bash
   render login
   ```

3. **Deploy**
   ```bash
   render deploy
   ```

---

## Post-Deployment Configuration

### Step 1: Set Environment Variables

1. **Go to Render Dashboard**
2. **Select your service** → **Environment**
3. **Add these variables:**

   ```
   MONGO_URL: mongodb+srv://username:password@cluster.mongodb.net/?retryWrites=true&w=majority
   JWT_SECRET: abc123def456_GhIjKlMnOpQrStUvWxYz1A2B3C4D5E6F
   MONGO_DB_NAME: ai_emergency_health_passport
   DRUG_INTERACTION_DEBUG: false
   ```

4. **For MONGO_URL and JWT_SECRET:**
   - Mark as **Secret** (hidden in logs)
   - Click **Save**

5. **Service will auto-restart** with new variables

### Step 2: Verify Deployment

1. **Get your URL**
   - Render dashboard shows: `https://ai-emergency-health-passport-backend.onrender.com`

2. **Test health endpoint**
   ```bash
   curl https://ai-emergency-health-passport-backend.onrender.com/health
   ```

   Should return:
   ```json
   {
     \"status\": \"OK\",
     \"message\": \"Backend is running successfully\",
     \"mongo_db\": \"ai_emergency_health_passport\"
   }
   ```

3. **Check logs**
   - Render dashboard → **Logs** tab
   - Look for: `[startup] ✅ MongoDB connected successfully`

### Step 3: Update Frontend URLs

Update your frontend apps to use the Render backend URL:

**React Dashboard (.env.development or .env.production):**
```
REACT_APP_API_BASE_URL=https://ai-emergency-health-passport-backend.onrender.com
```

**Flutter App:**
```bash
flutter run --dart-define=API_BASE_URL=https://ai-emergency-health-passport-backend.onrender.com
```

### Step 4: Configure CORS (if needed)

If frontend is also on Render, update `CORS_ALLOW_ORIGINS` in Render environment:

```
CORS_ALLOW_ORIGINS=https://doctor-dashboard.onrender.com,https://hospital-dashboard.onrender.com
```

---

## Troubleshooting

### ❌ Build Fails with \"ModuleNotFoundError\"

**Problem:** `ModuleNotFoundError: No module named 'app'`

**Solution:**
- Verify `rootDir: backend` in render.yaml
- Ensure `main.py` is in `backend/` directory
- Check `main.py` imports: `from app.main import app`

### ❌ MongoDB Connection Fails

**Problem:** Service keeps crashing with \"MongoDB connection failed\"

**Solutions:**
1. Verify MONGO_URL is set in Render environment
2. Check IP whitelist in MongoDB Atlas includes Render servers
   - Go to **Network Access** → **IP Whitelist**
   - Add Render IP or `0.0.0.0/0` (temporary)
3. Verify username/password in connection string
4. Test locally: `python -c \"from pymongo import MongoClient; MongoClient(MONGO_URL).admin.command('ping')\"`

### ❌ \"Address already in use\" Error

**Problem:** Port binding error during startup

**Solution:**
- This shouldn't happen on Render (each service gets unique port)
- Check `startCommand`: Must use `$PORT` environment variable
- Verify: `uvicorn main:app --host 0.0.0.0 --port $PORT`

### ❌ Slow Builds or Timeouts

**Problem:** Build takes > 15 minutes or times out

**Solutions:**
1. Use `requirements-render.txt` (fewer dependencies)
2. Exclude non-essential packages (ML/data science if not used)
3. Upgrade to standard tier (faster builds)
4. Clear build cache in Render dashboard

### ❌ CORS Errors in Browser

**Problem:** Frontend gets CORS error accessing backend

**Solutions:**
1. Add frontend URL to `CORS_ALLOW_ORIGINS`
   ```
   CORS_ALLOW_ORIGINS=https://your-frontend.onrender.com,http://localhost:3000
   ```
2. Verify frontend uses correct backend URL
3. Check browser console for actual error message

### ❌ Health Check Failing

**Problem:** Render shows \"Health Check Failed\"

**Solutions:**
1. Verify `/health` endpoint exists in `app/main.py`
2. Check MongoDB connection (see MongoDB section)
3. View deployment logs for error messages
4. Temporarily disable health check to debug

---

## Environment Variables Reference

| Variable | Purpose | Example | Required |
|----------|---------|---------|----------|
| MONGO_URL | MongoDB Atlas connection | `mongodb+srv://user:pass@cluster.mongodb.net/` | ✅ Yes |
| MONGO_DB_NAME | Database name | `ai_emergency_health_passport` | ❌ No (default) |
| JWT_SECRET | Auth token secret | `abc123...xyz789` | ✅ Yes |
| CORS_ALLOW_ORIGINS | Allowed frontend origins | `https://example.com,http://localhost:3000` | ❌ No |
| CORS_ALLOW_ORIGIN_REGEX | Regex for CORS matching | `https://.*\\.onrender\\.com` | ❌ No |
| DRUG_INTERACTION_DEBUG | Debug logging | `false` | ❌ No |

---

## Useful Commands

### Check Service Status
```bash
curl https://your-service.onrender.com/health
```

### View Logs (CLI)
```bash
render logs -s your-service-name
```

### Deploy Specific Branch
```bash
render deploy --service your-service-name --branch main
```

### Generate Strong Password/Secret
```bash
python -c \"import secrets; print(secrets.token_urlsafe(32))\"
```

---

## Next Steps

1. ✅ Deploy backend to Render
2. ✅ Deploy frontend dashboards to Render or Vercel
3. ✅ Set up custom domain (optional)
4. ✅ Enable monitoring and logging
5. ✅ Plan database backups and scaling

---

## Support & Resources

- [Render Documentation](https://render.com/docs)
- [MongoDB Atlas Support](https://www.mongodb.com/cloud/atlas/help)
- [FastAPI Production Guide](https://fastapi.tiangolo.com/deployment/)
- [Uvicorn Configuration](https://www.uvicorn.org/)

---

**Last Updated:** April 2026  
**Status:** Production Ready
