from django.contrib import admin
from .models import Product, CartItem, Cart, Category, UserProfile

# Register your models here.
admin.site.register(UserProfile)
admin.site.register(Category)

@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    list_display = ('name', 'category', 'price', 'original_price', 'expiry_date')
    list_filter = ('category', 'expiry_date')

@admin.register(Cart)
class CartAdmin(admin.ModelAdmin):
    list_display = ('user', 'created_at')
    list_filter = ('created_at',)

@admin.register(CartItem)
class CartItemAdmin(admin.ModelAdmin):
    list_display = ('cart', 'product', 'quantity')
    list_filter = ('cart',)
