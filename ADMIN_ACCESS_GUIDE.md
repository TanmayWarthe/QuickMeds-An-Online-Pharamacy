# 🔐 Admin Panel Access Guide

## For Render Deployment (Without Shell Access)

Since Render's Shell feature requires a paid plan, we've automated admin user creation during deployment.

### Step 1: Add Environment Variables to Render

1. Go to your Render Dashboard: https://dashboard.render.com/
2. Click on your **"dawai-ki-dukan"** web service
3. Go to the **"Environment"** tab
4. Add these three new environment variables:

```
ADMIN_USERNAME=admin
ADMIN_EMAIL=your-email@example.com
ADMIN_PASSWORD=YourSecurePassword123!
```

**⚠️ IMPORTANT:**
- Change `ADMIN_PASSWORD` to a strong, unique password
- Use a real email address for `ADMIN_EMAIL`
- You can change `ADMIN_USERNAME` to whatever you prefer

### Step 2: Redeploy

After adding the environment variables:
1. Click **"Manual Deploy"** → **"Deploy latest commit"**
2. Wait for deployment to complete (watch the logs)
3. You should see: `👤 Creating admin user...` in the logs

### Step 3: Access Admin Panel

Once deployment is complete, you can access the admin panel at:

**Option 1: Django Admin**
- URL: `https://your-site.onrender.com/admin/`
- Login with your `ADMIN_USERNAME` and `ADMIN_PASSWORD`

**Option 2: Custom Admin Panel**
- URL: `https://your-site.onrender.com/admin-panel/login/`
- Login with your admin credentials

---

## Testing Locally

You can test the command locally:

```bash
# Set environment variables
$env:ADMIN_USERNAME="admin"
$env:ADMIN_EMAIL="admin@test.com"
$env:ADMIN_PASSWORD="test123"

# Run the command
python manage.py create_admin
```

---

## Troubleshooting

### "Admin user already exists"
This is normal - it means the admin was already created. You can still login with your credentials.

### "No ADMIN_PASSWORD environment variable set"
You forgot to add the environment variables in Render. Go back to Step 1.

### Can't login after deployment
1. Make sure you're using the correct password you set in `ADMIN_PASSWORD`
2. Check Render logs to confirm admin user was created
3. Try resetting: Remove the environment variables, save, then add them back with a new password

---

## Security Notes

✅ **DO NOT** commit your actual admin password to GitHub
✅ Use a strong password (mix of letters, numbers, symbols)
✅ Keep your admin credentials secure
✅ Change the default username from "admin" to something unique
✅ After first login, consider creating additional admin users and removing the environment variables

---

## Alternative: Create Admin via One-Time Job

If you have issues, you can also create a one-time job in Render:

1. In Render Dashboard, go to your web service
2. Under "Jobs" section, click "Create Job"
3. Command: `python manage.py create_admin`
4. This will run once and create the admin user
