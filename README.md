# 🚀 QuickMeds - Modern Online Pharmacy Platform

[![Django](https://img.shields.io/badge/Django-4.2-green?logo=django)](https://www.djangoproject.com/)  
[![Python](https://img.shields.io/badge/Python-3.10-blue?logo=python)](https://www.python.org/)  
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)  
[![Deployment](https://img.shields.io/badge/Deployed%20on-Render-purple?logo=render)](https://dawai-ki-dukan.onrender.com)  

A production-ready, fully responsive Django-based online pharmacy application with modern UI/UX, secure payment integration, and comprehensive e-commerce functionality.

🌐 **Live Demo** → [QuickMeds Online Pharmacy](https://quickmedsonlinepharmacy.onrender.com)

---

## 📌 Project Overview

QuickMeds is a complete e-commerce platform for online pharmacy services, built with Django and modern web technologies. It provides a seamless shopping experience with secure authentication, real-time cart management, payment integration, and an admin dashboard.

### ✨ Key Highlights
- 📱 **Fully Responsive Design** - Mobile-first approach with optimized layouts for all devices
- 🔐 **OTP-based Authentication** - Secure login/signup with email verification
- 💳 **Payment Integration** - Razorpay payment gateway integration
- 🛒 **Real-time Cart Management** - AJAX-powered cart with instant updates
- 📊 **Admin Dashboard** - Comprehensive management for products, orders, and users
- 🎨 **Modern UI/UX** - Clean, minimal design with smooth animations

---

## 🔥 Features

### 👥 User Features
- ✅ OTP-based secure authentication (login/signup)
- ✅ User profile management with order history
- ✅ Product browsing with category filters
- ✅ Advanced search functionality
- ✅ Shopping cart with real-time updates
- ✅ Secure checkout process
- ✅ Order tracking and management
- ✅ Responsive mobile navigation

### 🛍️ E-Commerce Features
- ✅ Product catalog with categories
- ✅ Product detail pages with image galleries
- ✅ Stock management
- ✅ Price and discount management
- ✅ Featured products
- ✅ Search with filters

### 💰 Payment & Orders
- ✅ Razorpay payment integration
- ✅ Multiple payment methods (UPI, Cards, Net Banking)
- ✅ Order confirmation and tracking
- ✅ Order cancellation
- ✅ Payment verification

### 🔧 Admin Features
- ✅ Product management (CRUD operations)
- ✅ Category management
- ✅ Order management and tracking
- ✅ User management
- ✅ Contact form submissions
- ✅ Dashboard with analytics

---

## 🛠 Tech Stack

### Backend
- **Framework**: Django 4.2
- **Database**: PostgreSQL (Production) / MySQL / SQLite (Development)
- **Authentication**: Custom OTP-based system
- **Email**: SMTP with fallback to console
- **Cache**: Django Cache Framework
- **Media Storage**: Cloudinary

### Frontend
- **HTML5** / **CSS3** / **JavaScript (ES6+)**
- **Bootstrap 5.1.3**
- **Font Awesome 6.5.1**
- **Custom Responsive CSS** (Mobile-first)

### Payment
- **Razorpay** Payment Gateway Integration

### Deployment
- **Platform**: Render
- **Server**: Gunicorn
- **Static Files**: WhiteNoise
- **Database**: PostgreSQL (Production)

---

## 📁 Project Structure

```
DAWAI-KI-DUKAN/
├── 📂 quickmeds/                 # Main Django project configuration
│   ├── __init__.py
│   ├── asgi.py                   # ASGI configuration
│   ├── wsgi.py                   # WSGI configuration
│   ├── urls.py                   # Root URL configuration
│   ├── settings.py               # Main settings (imports from settings/)
│   └── 📂 settings/              # Environment-specific settings
│       ├── __init__.py
│       ├── base.py               # Base settings
│       ├── dev.py                # Development settings
│       ├── prod.py               # Production settings
│       └── test.py               # Test settings
│
├── 📂 QuickMedsApp/              # Main application
│   ├── __init__.py
│   ├── admin.py                  # Admin interface configuration
│   ├── apps.py                   # App configuration
│   ├── models.py                 # Database models
│   ├── views.py                  # View functions
│   ├── urls.py                   # App URL patterns
│   ├── forms.py                  # Django forms
│   ├── utils.py                  # Utility functions
│   ├── payment.py                # Payment processing logic
│   ├── razorpay_utils.py         # Razorpay integration
│   ├── tests.py                  # Unit tests
│   ├── 📂 migrations/            # Database migrations
│   ├── 📂 management/            # Custom management commands
│   │   └── 📂 commands/
│   │       └── create_admin.py
│   └── 📂 templatetags/          # Custom template tags
│       ├── __init__.py
│       └── custom_filters.py
│
├── 📂 utils/                     # Project-wide utilities
│   ├── __init__.py
│   └── otp.py                    # OTP generation and verification
│
├── 📂 templates/                 # HTML templates
│   ├── base.html                 # Base template
│   ├── home.html                 # Homepage
│   ├── login.html                # Login/Signup page
│   ├── product.html              # Product catalog
│   ├── product_detail.html       # Product detail page
│   ├── cart.html                 # Shopping cart
│   ├── checkout.html             # Checkout page
│   ├── profile.html              # User profile
│   ├── orders.html               # Order history
│   ├── order_detail.html         # Order details
│   ├── contact.html              # Contact form
│   ├── admin_*.html              # Admin templates
│   └── 📂 partials/              # Reusable components
│       ├── navbar.html           # Navigation bar
│       ├── sidebar.html          # Mobile sidebar
│       └── footer.html           # Footer
│
├── 📂 static/                    # Static files (development)
│   ├── 📂 css/                   # Stylesheets
│   │   ├── theme.css             # Global theme variables
│   │   ├── layout.css            # Layout components
│   │   ├── responsive.css        # Base responsive styles
│   │   ├── home-modern.css       # Homepage styles
│   │   ├── home-responsive.css   # Homepage responsive
│   │   ├── product-catalog.css   # Product catalog styles
│   │   ├── product-catalog-responsive.css
│   │   ├── product-detail.css
│   │   ├── product-detail-responsive.css
│   │   ├── cart-modern.css
│   │   ├── cart-checkout-responsive.css
│   │   ├── profile-modern.css
│   │   ├── profile-auth-responsive.css
│   │   └── ... (other CSS files)
│   │
│   ├── 📂 js/                    # JavaScript files
│   │   ├── cart.js               # Cart functionality
│   │   ├── cart_utils.js         # Cart utilities
│   │   ├── cart-button.js        # Add to cart button
│   │   ├── checkout.js           # Checkout process
│   │   ├── product.js            # Product catalog
│   │   ├── product-detail.js     # Product detail page
│   │   ├── profile.js            # User profile
│   │   ├── login.js              # Authentication
│   │   ├── search_handlers.js    # Search functionality
│   │   ├── sidebar.js            # Mobile sidebar
│   │   └── ... (other JS files)
│   │
│   └── 📂 img/                   # Images
│       └── logo.png
│
├── 📂 staticfiles/               # Collected static files (production)
│   └── ... (auto-generated by collectstatic)
│
├── 📂 .venv/                     # Virtual environment (not in git)
│
├── 📄 .env                       # Environment variables (not in git)
├── 📄 .gitignore                 # Git ignore rules
├── 📄 manage.py                  # Django management script
├── 📄 requirements.txt           # Python dependencies
├── 📄 Procfile                   # Render deployment config
├── 📄 build.sh                   # Build script for deployment
└── 📄 README.md                  # This file
```

---

## ⚙️ Installation & Setup

### Prerequisites
- Python 3.10 or higher
- pip (Python package manager)
- Git
- Virtual environment tool

### Local Development Setup

1. **Clone the repository**
```bash
git clone https://github.com/TanmayWarthe/QuickMeds-An-Online-Pharamacy.git
cd QuickMeds-An-Online-Pharamacy
```

2. **Create and activate virtual environment**
```bash
# Windows
python -m venv .venv
.venv\Scripts\activate

# Linux/macOS
python3 -m venv .venv
source .venv/bin/activate
```

3. **Install dependencies**
```bash
pip install -r requirements.txt
```

4. **Set up environment variables**

Create a `.env` file in the project root:
```env
# Django Settings
SECRET_KEY=your-secret-key-here
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1

# Database (for production)
DATABASE_URL=postgresql://user:password@localhost:5432/dbname

# Email Configuration
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=465
EMAIL_HOST_USER=your-email@gmail.com
EMAIL_HOST_PASSWORD=your-app-password

# Razorpay
RAZORPAY_KEY_ID=your-razorpay-key
RAZORPAY_KEY_SECRET=your-razorpay-secret

# Cloudinary
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
```

5. **Run migrations**
```bash
python manage.py migrate
```

6. **Create superuser**
```bash
python manage.py createsuperuser
```

7. **Collect static files**
```bash
python manage.py collectstatic --noinput
```

8. **Run development server**
```bash
python manage.py runserver
```

9. **Access the application**
- Frontend: http://localhost:8000
- Admin: http://localhost:8000/admin

---

## 🚀 Deployment

### Deploying to Render

1. **Fork/Clone the repository**

2. **Create a new Web Service on Render**
   - Connect your GitHub repository
   - Select the branch to deploy

3. **Configure Environment Variables**
   Add all variables from `.env` file to Render's environment variables

4. **Build Command**
```bash
./build.sh
```

5. **Start Command**
```bash
gunicorn quickmeds.wsgi:application
```

6. **Deploy**
   - Render will automatically deploy on every push to the main branch

---

## 🔧 Configuration

### Database Configuration

**Development (SQLite)**
```python
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': BASE_DIR / 'db.sqlite3',
    }
}
```

**Production (PostgreSQL)**
```python
import dj_database_url
DATABASES = {
    'default': dj_database_url.config(
        default=os.getenv('DATABASE_URL'),
        conn_max_age=600
    )
}
```

### Static Files

Static files are served using WhiteNoise in production:
```python
MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'whitenoise.middleware.WhiteNoiseMiddleware',  # WhiteNoise
    # ... other middleware
]

STATICFILES_STORAGE = 'whitenoise.storage.CompressedManifestStaticFilesStorage'
```

---

## 📱 Responsive Design

The application uses a mobile-first responsive design approach:

- **Mobile**: 320px - 767px (Base styles)
- **Tablet**: 768px - 1023px
- **Desktop**: 1024px+

Key responsive features:
- Collapsible mobile sidebar navigation
- Touch-optimized buttons and controls
- Flexible grid layouts
- Responsive images and typography
- Mobile-optimized checkout flow

---

## 🔐 Security Features

- CSRF protection on all forms
- XSS prevention with Django templating
- Secure password hashing
- OTP-based authentication
- SQL injection protection via Django ORM
- HTTPS enforcement in production
- Environment-based configuration
- Secure payment processing

---

## 📊 Key URLs

| URL Pattern | View | Description |
|------------|------|-------------|
| `/` | home | Homepage |
| `/login/` | login_view | Login/Signup |
| `/logout/` | logout_view | Logout |
| `/product/` | product_view | Product catalog |
| `/product/<id>/` | product_detail | Product details |
| `/cart/` | cart_view | Shopping cart |
| `/checkout/` | checkout_view | Checkout |
| `/orders/` | orders_view | Order history |
| `/profile/` | profile_view | User profile |
| `/admin/` | Django Admin | Admin dashboard |

---

## 👨‍💻 Author

**Tanmay Warthe**
- GitHub: [@TanmayWarthe](https://github.com/TanmayWarthe)

---

## 📄 License

This project is licensed under the MIT License.

---

## 🙏 Acknowledgments

- Django framework and community
- Bootstrap for responsive design
- Font Awesome for icons
- Razorpay for payment integration
- Cloudinary for media management
- Render for hosting

---

## 📝 Changelog

### Version 2.0 (December 2024)
- ✅ Complete mobile responsiveness with sidebar navigation
- ✅ Enhanced UI/UX with modern design
- ✅ Optimized performance and load times
- ✅ Production-ready folder structure
- ✅ Comprehensive documentation

### Version 1.0 (November 2024)
- ✅ Initial release with core functionality
- ✅ OTP authentication system
- ✅ Payment integration
- ✅ Admin dashboard

---

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

---

**Made with ❤️ by Tanmay Warthe**
