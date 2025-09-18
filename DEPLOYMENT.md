# 🚀 Render Deployment Guide for QuickMeds

This guide will help you deploy your Django QuickMeds application to Render.

## Prerequisites

1. A Render account (sign up at [render.com](https://render.com))
2. A Cloudinary account for media storage (sign up at [cloudinary.com](https://cloudinary.com))
3. Your project code pushed to GitHub

## Step 1: Prepare Your Repository

1. Make sure all your code is committed and pushed to GitHub
2. The following files should be in your repository root:
   - `requirements.txt`
   - `Procfile`
   - `render.yaml`
   - `build.sh`

## Step 2: Create Environment Variables

Before deploying, you'll need to set up these environment variables in Render:

### Required Environment Variables:

```
DJANGO_SECRET_KEY=your-secret-key-here
DEBUG=False
ALLOWED_HOSTS=dawai-ki-dukan-j67h.onrender.com,.onrender.com
DATABASE_URL=postgresql://username:password@host:port/database_name
USE_CLOUDINARY=True
CLOUDINARY_CLOUD_NAME=your-cloudinary-cloud-name
CLOUDINARY_API_KEY=your-cloudinary-api-key
CLOUDINARY_API_SECRET=your-cloudinary-api-secret
EMAIL_HOST_USER=tanmaywarthe09@gmail.com
EMAIL_HOST_PASSWORD=your-email-password
RAZORPAY_KEY_ID=rzp_test_tPcdMpc0pKpdgJ
RAZORPAY_KEY_SECRET=your-razorpay-secret
```

## Step 3: Deploy to Render

### Option A: Using render.yaml (Recommended)

1. Go to [Render Dashboard](https://dashboard.render.com)
2. Click "New +" → "Blueprint"
3. Connect your GitHub repository
4. Select your repository
5. Render will automatically detect the `render.yaml` file
6. Click "Apply" to deploy

### Option B: Manual Setup

1. Go to [Render Dashboard](https://dashboard.render.com)
2. Click "New +" → "Web Service"
3. Connect your GitHub repository
4. Configure the service:
   - **Name**: `dawai-ki-dukan`
   - **Environment**: `Python 3`
   - **Build Command**: `pip install -r requirements.txt && python manage.py collectstatic --noinput && python manage.py migrate`
   - **Start Command**: `gunicorn quickmeds.wsgi:application`

## Step 4: Set Up PostgreSQL Database

1. In Render Dashboard, click "New +" → "PostgreSQL"
2. Name it `dawai-ki-dukan-db`
3. Choose the free plan
4. Copy the database URL and add it to your environment variables as `DATABASE_URL`

## Step 5: Configure Cloudinary (Optional but Recommended)

1. Sign up at [Cloudinary](https://cloudinary.com)
2. Get your Cloud Name, API Key, and API Secret from the dashboard
3. Add these to your environment variables in Render

## Step 6: Set Up Email (Optional)

1. Use Gmail App Passwords for email functionality
2. Add your email credentials to environment variables

## Step 7: Configure Razorpay

1. Get your Razorpay keys from the Razorpay dashboard
2. Add them to your environment variables

## Post-Deployment

1. Your app will be available at `https://dawai-ki-dukan-j67h.onrender.com`
2. Create a superuser: Go to Render shell and run:
   ```bash
   python manage.py createsuperuser
   ```

## Troubleshooting

### Common Issues:

1. **Static files not loading**: Make sure `collectstatic` is running in build command
2. **Database errors**: Ensure PostgreSQL is properly configured
3. **Media files not working**: Set up Cloudinary for production
4. **Email not working**: Check email credentials and Gmail app passwords

### Logs:

Check your application logs in the Render dashboard for any errors.

## Security Notes

- Never commit sensitive information to your repository
- Use environment variables for all secrets
- Keep your `DEBUG=False` in production
- Use HTTPS (enabled by default on Render)

## Support

If you encounter any issues, check:
1. Render documentation: [docs.render.com](https://docs.render.com)
2. Django deployment guide: [docs.djangoproject.com](https://docs.djangoproject.com/en/stable/howto/deployment/)
3. Your application logs in Render dashboard
