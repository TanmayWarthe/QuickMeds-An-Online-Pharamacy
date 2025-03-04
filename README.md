
# QuickMeds Online Pharmacy

A Django-based online pharmacy application that allows users to browse, search, and purchase medicines online.

## Setup Instructions

1. Clone the repository:
```bash
git clone https://github.com/yourusername/QuickMeds-Online-Pharmacy.git
cd QuickMeds-Online-Pharmacy
```

2. Create and activate a virtual environment:
```bash
python -m venv .venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate
```

3. Install dependencies:
```bash
pip install -r requirements.txt
```

4. Create a .env file in the project root and add the following variables:
```
DJANGO_SECRET_KEY=your-secret-key-here
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1
SECURE_SSL_REDIRECT=False
SESSION_COOKIE_SECURE=False
CSRF_COOKIE_SECURE=False
```

5. Run migrations:
```bash
python manage.py migrate
```

6. Create a superuser:
```bash
python manage.py createsuperuser
```

7. Run the development server:
```bash
python manage.py runserver
```

## Features

- User authentication and registration
- Product browsing and searching
- Shopping cart functionality
- User profiles
- Admin interface for managing products and orders

## Production Deployment

For production deployment:

1. Update .env file with production settings:
```
DEBUG=False
ALLOWED_HOSTS=your-domain.com
SECURE_SSL_REDIRECT=True
SESSION_COOKIE_SECURE=True
CSRF_COOKIE_SECURE=True
```

2. Generate a new secret key:
```python
from django.core.management.utils import get_random_secret_key
print(get_random_secret_key())
```

3. Update DJANGO_SECRET_KEY in .env with the new key

4. Set up a production-grade database (PostgreSQL recommended)

5. Configure static files serving

6. Set up HTTPS

## Security Notes

- Never commit .env file to version control
- Keep DEBUG=False in production
- Regularly update dependencies
- Use strong passwords
- Enable HTTPS in production

## Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a new Pull Request

# QuickMeds-Online-Pharmacy

# 🚀 QuickMeds - Online Pharmacy Management System  

![QuickMeds Banner](https://via.placeholder.com/1200x400?text=QuickMeds+-+Online+Pharmacy+Management+System)  

## 📌 Overview  
QuickMeds is a cutting-edge online pharmacy platform designed to provide a seamless and secure shopping experience for medicines and healthcare essentials. Developed using Django and modern web technologies, it ensures easy access to pharmaceutical products with a user-friendly interface and robust security features.

---

## 🔥 Key Features  

### ✅ **User Management**  
- Secure **Login & Signup**  
- Role-based access control (**Admin, Pharmacist, Customer**)  
- User **profile management & order history**  
- **Password recovery & security settings**  

### 🏥 **Product Management**  
- **Categorized product display** for easy browsing  
- **Product sliders** with featured categories:  
  - **Healthcare Products**  
  - **Daily Essentials**  
  - **Medical Equipment**  
- Detailed product pages with:  
  - **High-quality images**  
  - **Pricing (original & discount price)**  
  - **Stock status & category tags**  
- **Advanced search & filter options**  

### 🛒 **Shopping & Checkout Features**  
- **Interactive Shopping Cart** with real-time updates  
- **Quantity management & price calculations**  
- **Secure checkout process** with multiple payment options:  
  - **UPI, Credit/Debit Card, Net Banking, Cash on Delivery**  
- **Order tracking & email notifications**  
- **Address management for hassle-free delivery**  

### 🎨 **User Interface & Experience**  
- **Responsive design** (Mobile & Desktop-friendly)  
- **User-friendly navigation & clean UI**  
- **Category-based browsing & search functionality**  
- **Modern aesthetics with professional design**  

### 🔐 **Security & Compliance**  
- **Secure authentication (CSRF & XSS protection)**  
- **Encrypted user data for privacy**  
- **Secure checkout with OTP verification**  
- **Regulatory compliance for pharmacy guidelines**  
- **Verified vendors & prescription-based medicine orders**  

---

## 🛠️ Tech Stack  
- **Backend:** Django Framework 🐍  
- **Frontend:** HTML5, CSS3, JavaScript 🌐  
- **Database:** SQLite3 (Upgradeable to PostgreSQL/MySQL) 🗄️  
- **UI Framework:** Bootstrap 🎨  
- **Icons & Styling:** Font Awesome ✨  
- **Version Control:** Git & GitHub 🔄  

---

# QuickMeds-Online-Pharmacy

