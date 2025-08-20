
# 🚀 QuickMeds - Online Pharmacy Management System  

[![Django](https://img.shields.io/badge/Django-4.2-green?logo=django)](https://www.djangoproject.com/)  
[![Python](https://img.shields.io/badge/Python-3.10-blue?logo=python)](https://www.python.org/)  
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)  
[![Deployment](https://img.shields.io/badge/Deployed%20on-Render-purple?logo=render)](https://dawai-ki-dukan.onrender.com)  

Hi 👋, I’m **Tanmay** and this is my project **QuickMeds**, a Django-based online pharmacy application.  
It allows users to **browse, search, and purchase medicines online** with a simple and secure experience.  

🌐 **Live Demo** → [QuickMeds Online Pharmacy](https://dawai-ki-dukan.onrender.com)  

---

## 📌 Overview  
I built QuickMeds to make healthcare more **accessible and reliable**.  
It provides:  
✅ Easy browsing of medicines & healthcare essentials  
✅ Secure ordering and checkout  
✅ Admin dashboard for managing stock and orders  
✅ A smooth user experience for both customers and admins  

---

## 🔥 Key Features  

### 👤 User Management  
- Secure login & signup  
- Role-based access (Admin / Customer)  
- User profile & order history  
- Password reset & account settings  

### 🏥 Product Management  
- Categorized product listings  
- Featured products & discounts  
- Advanced search & filtering  
- Stock & inventory management  

### 🛒 Shopping & Checkout  
- Interactive shopping cart  
- Real-time price updates  
- Multiple payment options (UPI, Cards, COD)  
- Order tracking & notifications  

### 🔐 Security  
- CSRF & XSS protection  
- Encrypted data storage  
- HTTPS support for production  
- Prescription verification for medicines  

---

## 🛠 Tech Stack  

| Layer        | Technology |
|--------------|------------|
| **Backend**  | Django (Python) |
| **Frontend** | HTML5, CSS3, JavaScript, Bootstrap |
| **Database** | SQLite (Dev) |
| **Hosting**  | Render |
| **Version Control** | Git & GitHub |

---

## 📑 API Documentation  

Here are some of the main API endpoints I implemented:  

| Method | Endpoint              | Description                  |
|--------|-----------------------|------------------------------|
| `GET`  | `/api/products/`      | Returns list of medicines    |
| `POST` | `/api/cart/add/`      | Adds product to cart         |
| `POST` | `/api/order/checkout/`| Processes checkout & payment |

---

## ⚙️ Setup Instructions  

If you’d like to run this project locally:  

1. **Clone the repository**  
```bash
git clone https://github.com/TanmayWarthe/DAWAI-KI-DUKAN
cd DAWAI-KI-DUKAN
````

2. **Create virtual envvironment & install dependencies**

```bash
python -m venv .venv
source .venv/bin/activate   # On Windows: .venv\Scripts\activate
pip install -r requirements.txt
```

3. **Create `.env` file**

```env
DJANGO_SECRET_KEY=your-secret-key
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1
SECURE_SSL_REDIRECT=False
SESSION_COOKIE_SECURE=False
CSRF_COOKIE_SECURE=False
```

4. **Migrate & Run**

```bash
python manage.py migrate
python manage.py createsuperuser
python manage.py runserver
```

## 🚀 Production Deployment

When deploying to production, I used **Render**.
Here’s what I configured:

1. Update `.env` file with production settings:

```env
DEBUG=False
ALLOWED_HOSTS=your-domain.com
SECURE_SSL_REDIRECT=True
SESSION_COOKIE_SECURE=True
CSRF_COOKIE_SECURE=True
```

2. Generate a secure Django secret key:

```python
from django.core.management.utils import get_random_secret_key
print(get_random_secret_key())
```

3. Use PostgreSQL/MySQL for production database
4. Collect static files using `python manage.py collectstatic`
5. Enable **HTTPS** for security

---

## 🔒 Security Notes

Some rules I always follow while working with Django apps:

* ❌ Never commit `.env` file
* ⚠️ Always set `DEBUG=False` in production
* 🔄 Keep dependencies updated
* 🔑 Use strong admin credentials
* 🔐 Enable HTTPS in production

---

## 🤝 Contributing

I’d love contributions to make QuickMeds even better 🚀

1. Fork this repository
2. Create a feature branch (`git checkout -b feature-name`)
3. Commit changes (`git commit -m "Added feature"`)
4. Push to branch (`git push origin feature-name`)
5. Open a Pull Request 🎉

---

## 👨‍💻 Author

Hi, I’m **Tanmay** 👋

* 📧 Email: tanmaywarthe02@gmail.com
* 🐙 GitHub: [TanmayWarthe](https://github.com/TanmayWarthe)
