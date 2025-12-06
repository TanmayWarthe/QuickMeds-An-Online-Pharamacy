# 🚀 QuickMeds - Quick Deployment Guide for Render

## ⚡ Fast Track Deployment (5 Steps)

### Step 1: Create PostgreSQL Database on Render
1. Go to [Render Dashboard](https://dashboard.render.com/)
2. Click **"New +"** → **"PostgreSQL"**
3. Configure:
   - **Name**: `quickmeds-db`
   - **Database**: `quickmeds_db`
   - **Region**: Choose closest to you
   - **Plan**: Free (or Starter for better performance)
4. Click **"Create Database"**
5. **COPY** the **"Internal Database URL"** (looks like: `postgresql://user:pass@host.internal:5432/db`)

### Step 2: Create Web Service on Render
1. Click **"New +"** → **"Web Service"**
2. Connect your GitHub repository: `TanmayWarthe/DAWAI-KI-DUKAN`
3. Configure:
   - **Name**: `dawai-ki-dukan`
   - **Region**: Same as database
   - **Branch**: `main`
   - **Runtime**: `Python 3`
   - **Build Command**: `./build.sh`
   - **Start Command**: `gunicorn quickmeds.wsgi:application`

### Step 3: Set Environment Variables
In the Web Service settings, click **"Environment"** tab and add:

```env
DJANGO_SECRET_KEY=<generate-below>
DJANGO_ENV=prod
DEBUG=False
DATABASE_URL=<paste-from-step-1>
ALLOWED_HOSTS=dawai-ki-dukan-j67h.onrender.com,.onrender.com
CSRF_TRUSTED_ORIGINS=https://dawai-ki-dukan-j67h.onrender.com,https://*.onrender.com
```

**Generate SECRET_KEY** (run locally):
```bash
python -c "from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())"
```

### Step 4: Deploy
1. Click **"Create Web Service"**
2. Wait for deployment (5-10 minutes)
3. Watch the logs for any errors

### Step 5: Create Admin User
1. After deployment succeeds, go to **"Shell"** tab in Render
2. Run:
```bash
python manage.py createsuperuser
```
3. Follow prompts to create admin account

---

## ✅ Verify Deployment

1. **Visit your site**: `https://dawai-ki-dukan-j67h.onrender.com`
2. **Check admin**: `https://dawai-ki-dukan-j67h.onrender.com/admin`
3. **Test login/registration**
4. **Browse products**

---

## 🔧 Optional: Add Email & Payment

### Email (Gmail)
Add to environment variables:
```env
EMAIL_HOST_USER=your-email@gmail.com
EMAIL_HOST_PASSWORD=your-gmail-app-password
```

Get App Password: https://myaccount.google.com/apppasswords

### Razorpay Payment
Add to environment variables:
```env
RAZORPAY_KEY_ID=your_key_id
RAZORPAY_KEY_SECRET=your_key_secret
```

Get keys: https://dashboard.razorpay.com/app/keys

---

## 🐛 Troubleshooting

### Database Connection Error
- Verify `DATABASE_URL` is set correctly
- Use **Internal Database URL** not External
- Ensure database and web service are in same region

### Static Files Not Loading
- Check build logs for `collectstatic` success
- Verify WhiteNoise is in MIDDLEWARE (already configured)

### 500 Error
- Check logs in Render Dashboard
- Verify all required environment variables are set
- Ensure `DEBUG=False` and `DJANGO_ENV=prod`

### CSRF Error
- Add your domain to `CSRF_TRUSTED_ORIGINS`
- Must include `https://` prefix

---

## 📊 Current Configuration Status

✅ **Database Settings**: Configured for PostgreSQL/MySQL/SQLite  
✅ **Static Files**: WhiteNoise configured  
✅ **Security**: Production security settings ready  
✅ **Build Script**: Automated migrations and static collection  
✅ **WSGI**: Gunicorn configured in Procfile  
✅ **Settings Split**: Dev/Prod/Test environments  

---

## 🔄 Updating Your Deployment

When you push changes to GitHub:
1. Render auto-deploys from `main` branch
2. Runs `build.sh` automatically
3. Restarts service

**Manual Deploy**:
- Render Dashboard → Your Service → "Manual Deploy" → "Deploy latest commit"

---

## 📝 Important Files

- `build.sh` - Build commands (migrations, static files)
- `Procfile` - Start command (gunicorn)
- `requirements.txt` - Python dependencies
- `quickmeds/settings/prod.py` - Production settings
- `DEPLOYMENT_CHECKLIST.md` - Detailed checklist
- `RENDER_ENV_TEMPLATE.txt` - All environment variables

---

## 🎯 Next Steps After Deployment

1. ✅ Create superuser account
2. ✅ Login to admin panel
3. ✅ Add product categories
4. ✅ Add products
5. ✅ Test ordering flow
6. ✅ Configure email (optional)
7. ✅ Configure payment gateway (optional)
8. ✅ Set up custom domain (optional)

---

**Need Help?**
- Check `DEPLOYMENT_CHECKLIST.md` for detailed guide
- View Render logs for errors
- Verify environment variables are set correctly

**Last Updated**: 2025-12-02
