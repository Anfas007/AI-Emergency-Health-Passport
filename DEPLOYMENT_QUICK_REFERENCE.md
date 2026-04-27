# Render Deployment Quick Reference Card

## 🚀 Quick Deploy Checklist

- [ ] MongoDB Atlas cluster created
- [ ] Database user created (username/password)
- [ ] IP whitelist configured (add Render IP)
- [ ] Connection string copied (MONGO_URL)
- [ ] JWT secret generated
- [ ] Code pushed to GitHub
- [ ] render.yaml verified in project root
- [ ] requirements.txt has all dependencies
- [ ] Render service created
- [ ] Environment variables set in Render dashboard
- [ ] Health check passing (GET /health)
- [ ] Frontend URLs updated to use Render backend

---

## 📋 Environment Variables to Set

In Render Dashboard → Environment:

```
MONGO_URL = mongodb+srv://user:pass@cluster.mongodb.net/?retryWrites=true&w=majority
JWT_SECRET = (generate with: python -c \"import secrets; print(secrets.token_urlsafe(32))\")
MONGO_DB_NAME = ai_emergency_health_passport
CORS_ALLOW_ORIGINS = https://your-frontend.onrender.com,http://localhost:3000
DRUG_INTERACTION_DEBUG = false
```

Mark MONGO_URL and JWT_SECRET as **Secret** in Render.

---

## 🔗 MongoDB Atlas Connection Steps

1. Create cluster (free tier M0)
2. Create user with strong password
3. Add IP whitelist (include Render IPs or 0.0.0.0/0)
4. Click \"Connect\" → \"Python\" → Copy connection string
5. Replace `<username>` and `<password>` in string
6. Set as MONGO_URL in Render

---

## 🌐 Render Configuration

**File: render.yaml**

```yaml
rootDir: backend
buildCommand: pip install --upgrade pip && pip install -r requirements.txt
startCommand: uvicorn main:app --host 0.0.0.0 --port $PORT
```

---

## ✅ Verify Deployment

Test backend is running:

```bash
curl https://your-service.onrender.com/health
```

Should return:

```json
{
  \"status\": \"OK\",
  \"message\": \"Backend is running successfully\",
  \"mongo_db\": \"ai_emergency_health_passport\"
}
```

---

## 🔍 Common Issues & Fixes

| Issue | Solution |
|-------|----------|
| MongoDB connection fails | Check MONGO_URL in environment, verify IP whitelist |
| Build fails | Ensure `rootDir: backend` in render.yaml |
| Port binding error | Ensure startCommand uses `$PORT` variable |
| CORS errors | Add frontend URL to CORS_ALLOW_ORIGINS |
| Health check failing | Verify MongoDB connection (see logs) |

---

## 📊 URLs After Deployment

- **Backend API:** `https://ai-emergency-health-passport-backend.onrender.com`
- **Health Check:** `https://ai-emergency-health-passport-backend.onrender.com/health`
- **Logs:** Render Dashboard → Service → Logs tab

---

## 💡 Pro Tips

1. **Use secrets:** Mark MONGO_URL and JWT_SECRET as \"Secret\" in Render
2. **Monitor logs:** Watch deployment logs for connection errors
3. **Test locally first:** Verify with local MongoDB before deploying
4. **Keep .env.example:** Don't commit real .env file to git
5. **Auto-deploy:** Push to main branch to auto-deploy on Render
6. **Free tier:** Spins down after 15 min of inactivity; first request takes 30 sec to wake up

---

## 🆘 Emergency Contacts & Resources

- **Render Docs:** https://render.com/docs
- **MongoDB Atlas:** https://www.mongodb.com/cloud/atlas
- **FastAPI Docs:** https://fastapi.tiangolo.com
- **Issue? Check logs:** Render → Service → Logs
