from django.utils import timezone
from datetime import date, timezone
from django.db import models
from django.contrib.auth.models import User

class UserProfile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE)
    phone = models.CharField(max_length=15, null=True, blank=True)
    address = models.TextField(blank=True, null=True)
    
    def __str__(self):
        return self.user.username

class Category(models.Model):
    name = models.CharField(max_length=255)

    def __str__(self):
        return self.name

class Product(models.Model):
    # Basic Information
    name = models.CharField(max_length=255)
    code = models.CharField(max_length=50, unique=True, blank=True, null=True)
    description = models.TextField(blank=True, null=True)
    
    # Category
    category = models.ForeignKey(Category, on_delete=models.CASCADE, related_name='products')
    
    # Pricing
    price = models.DecimalField(max_digits=10, decimal_places=2)
    original_price = models.DecimalField(max_digits=10, decimal_places=2, blank=True, null=True)
    
    # Stock and Status
    in_stock = models.BooleanField(default=True)
    expiry_date = models.DateField(null=True, blank=True)
    
    # Images
    image = models.ImageField(upload_to='products/', blank=True, null=True)
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']
        verbose_name = 'Product'
        verbose_name_plural = 'Products'

    def __str__(self):
        return self.name

    # Price Related Methods
    @property
    def discount_percentage(self):
        if self.original_price and self.price < self.original_price:
            return round(((self.original_price - self.price) / self.original_price) * 100, 2)
        return 0

    # Expiry Related Methods
    def is_expiring_soon(self):
        if self.expiry_date:
            today = date.today()
            days_until_expiry = (self.expiry_date - today).days
            return days_until_expiry <= 30
        return False

    @property 
    def is_expired(self):
        if self.expiry_date:
            today = date.today()
            return self.expiry_date < today
        return False

    @property
    def days_until_expiry(self):
        if self.expiry_date:
            today = date.today()
            return (self.expiry_date - today).days
        return None

class ProductImage(models.Model):
    product = models.ForeignKey(Product, related_name='additional_images', on_delete=models.CASCADE)
    image = models.ImageField(upload_to='products/')

    def __str__(self):
        return f"Image for {self.product.name}"

class Cart(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def get_total(self):
        return sum(item.get_total_price() for item in self.cartitem_set.all())

    def __str__(self):
        return f"Cart for {self.user.username}"

class CartItem(models.Model):
    cart = models.ForeignKey(Cart, on_delete=models.CASCADE)
    product = models.ForeignKey(Product, on_delete=models.CASCADE)
    quantity = models.PositiveIntegerField(default=1)

    def get_total_price(self):
        return self.product.price * self.quantity

    def __str__(self):
        return f"{self.quantity} x {self.product.name}"