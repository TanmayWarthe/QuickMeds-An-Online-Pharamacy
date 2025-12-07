# Quick Start Guide - OTP Login Feature

## 🚀 How to Use OTP Login

### For Users:

#### **Step 1: Go to Login Page**
- Navigate to the login page
- You'll see the familiar login form

#### **Step 2: Enter Credentials**
```
Email: your@email.com
Password: ********
```
- Click **"SIGN IN"** button

#### **Step 3: OTP Sent**
✉️ **Check your email inbox for OTP**
```
Subject: QuickMeds - Your Login OTP

Your OTP: 1234
Valid for: 10 minutes
```

#### **Step 4: Enter OTP**
- Login form will automatically switch to OTP verification
- You'll see 4 boxes: `[ _ ] [ _ ] [ _ ] [ _ ]`
- Type your 4-digit OTP
- Auto-focus moves to next box

#### **Step 5: Verify**
- Click **"Verify OTP"** button
- ✅ Success → Redirected to home page
- ❌ Invalid → Error message, try again

#### **Troubleshooting Options:**

**Didn't receive OTP?**
- Click **"Resend OTP"** button
- New OTP will be sent to your email

**Want to try different credentials?**
- Click **"Back to Login"** button
- Returns to login form

---

## 🔧 For Developers:

### Quick Test (Development Mode):

1. **Start the server:**
```powershell
python manage.py runserver
```

2. **Go to login page:**
```
http://127.0.0.1:8000/login/
```

3. **Try logging in:**
- Email: `test@example.com`
- Password: `your_password`

4. **Check Console Output:**
```
==================================================
OTP for test@example.com: 1234
==================================================
Email not configured - Using console fallback
OTP for test@example.com: 1234
```

5. **Enter OTP from console:**
- Type: `1234` in the 4 OTP boxes
- Click "Verify OTP"
- Should login successfully!

### Production Setup:

**Configure Email in `.env`:**
```env
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=465
EMAIL_HOST_USER=your-email@gmail.com
EMAIL_HOST_PASSWORD=your-app-password
EMAIL_USE_SSL=True
```

**Or in `settings.py`:**
```python
EMAIL_HOST = 'smtp.gmail.com'
EMAIL_PORT = 465
EMAIL_HOST_USER = 'your-email@gmail.com'
EMAIL_HOST_PASSWORD = 'your-app-password'
EMAIL_USE_SSL = True
DEFAULT_FROM_EMAIL = 'QuickMeds <your-email@gmail.com>'
```

---

## 📋 API Endpoints Reference

### 1. Login (Request OTP)
```javascript
POST /login/
{
    "action": "login",
    "email": "user@example.com",
    "password": "password123"
}

// Response:
{
    "success": true,
    "otp_required": true,
    "message": "OTP sent to your email. Please verify to continue."
}
```

### 2. Verify Login OTP
```javascript
POST /login/
{
    "action": "verify_login_otp",
    "otp": "1234"
}

// Response:
{
    "success": true,
    "message": "Welcome back John!",
    "redirect_url": "/"
}
```

### 3. Resend Login OTP
```javascript
POST /login/
{
    "action": "resend_login_otp"
}

// Response:
{
    "success": true,
    "message": "New OTP sent to your email."
}
```

---

## 🎨 UI Components

### OTP Input Boxes:
```html
<!-- Auto-focus, auto-tab, paste support -->
<div class="otp-input-container">
    <input type="text" maxlength="1" class="otp-input-login" />
    <input type="text" maxlength="1" class="otp-input-login" />
    <input type="text" maxlength="1" class="otp-input-login" />
    <input type="text" maxlength="1" class="otp-input-login" />
</div>
```

### Button Actions:
```html
<!-- Verify OTP -->
<button onclick="verifyLoginOTP()">Verify OTP</button>

<!-- Resend OTP (Green) -->
<button class="resend" onclick="resendLoginOTP()">Resend OTP</button>

<!-- Back to Login (Gray) -->
<button class="back-to-login" onclick="backToLogin()">Back to Login</button>
```

---

## ✅ Testing Checklist

- [ ] Login with valid credentials
- [ ] Receive OTP email
- [ ] Enter correct OTP → Success
- [ ] Enter wrong OTP → Error shown
- [ ] Resend OTP → New OTP received
- [ ] Back to login → Form reset
- [ ] Paste OTP → All boxes filled
- [ ] Keyboard navigation works
- [ ] Auto-focus to next box
- [ ] Backspace to previous box
- [ ] Mobile responsive design
- [ ] Error messages clear
- [ ] Success redirect works

---

## 🐛 Common Issues & Solutions

### Issue 1: OTP not received in email
**Solution:**
- Check spam folder
- Verify email configuration in settings
- Look for OTP in server console (development mode)

### Issue 2: "Invalid OTP" error
**Solution:**
- Make sure you entered all 4 digits
- Check if OTP expired (10 minutes)
- Click "Resend OTP" for new code

### Issue 3: "Session expired" error
**Solution:**
- Click "Back to Login"
- Re-enter email and password
- Get new OTP

### Issue 4: OTP boxes not working
**Solution:**
- Clear browser cache
- Hard refresh (Ctrl+F5)
- Try different browser

---

## 📱 Mobile Experience

### Features:
- ✅ Responsive design
- ✅ Touch-friendly OTP boxes
- ✅ Mobile keyboard optimization
- ✅ Auto-zoom prevention
- ✅ Easy thumb navigation

### Mobile Testing:
```
- iOS Safari: ✅
- Android Chrome: ✅
- Mobile Firefox: ✅
- Samsung Internet: ✅
```

---

## 🔐 Security Notes

1. **OTP Validity**: 10 minutes only
2. **One-time Use**: OTP deleted after verification
3. **Session-based**: Tied to user session
4. **Email Verification**: Confirms user identity
5. **No OTP in URL**: Security best practice

---

## 💡 Tips & Tricks

### For Users:
- 📧 Add QuickMeds email to contacts (prevents spam)
- ⏱️ OTP valid for 10 minutes
- 🔢 Only numbers allowed in OTP boxes
- ⌨️ Use keyboard arrows to navigate
- 📋 Can paste full OTP code

### For Developers:
- 🐞 Check console for OTP in development
- 📝 OTP stored in cache (Redis/MemCache)
- 🔄 OTP regenerated on resend
- 🎯 Session cleared after login
- 📊 Add logging for audit trail

---

## 📞 Support

**Issues or Questions?**
- Check `OTP_LOGIN_IMPLEMENTATION.md` for detailed docs
- Review server logs for errors
- Test with console OTP first
- Verify email configuration

---

**Last Updated**: December 8, 2025  
**Version**: 1.0  
**Status**: ✅ Production Ready
