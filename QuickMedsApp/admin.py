from django.contrib import admin
from .models import (
    Product, CartItem, Cart, Category, UserProfile, Address,
    ProductImage, Order, OrderItem, Contact, Purchase, CheckoutSession
)

# Register your models here.
@admin.register(UserProfile)
class UserProfileAdmin(admin.ModelAdmin):
    list_display = ('user', 'phone', 'city', 'state', 'created_at')
    list_filter = ('gender', 'state', 'created_at')
    search_fields = ('user__email', 'user__username', 'phone', 'city')

@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ('name',)
    search_fields = ('name',)

@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    list_display = ('name', 'code', 'category', 'price', 'original_price', 'stock', 'in_stock', 'expiry_date')
    list_filter = ('category', 'in_stock', 'expiry_date', 'created_at')
    search_fields = ('name', 'code', 'description')
    readonly_fields = ('created_at', 'updated_at')

@admin.register(ProductImage)
class ProductImageAdmin(admin.ModelAdmin):
    list_display = ('product', 'image')
    list_filter = ('product',)

@admin.register(Address)
class AddressAdmin(admin.ModelAdmin):
    list_display = ('user', 'type', 'full_name', 'city', 'state', 'is_default')
    list_filter = ('type', 'is_default', 'state', 'country')
    search_fields = ('full_name', 'phone_number', 'city', 'state')

@admin.register(Cart)
class CartAdmin(admin.ModelAdmin):
    list_display = ('user', 'created_at', 'updated_at')
    list_filter = ('created_at',)
    search_fields = ('user__email', 'user__username')

@admin.register(CartItem)
class CartItemAdmin(admin.ModelAdmin):
    list_display = ('cart', 'product', 'quantity', 'get_total')
    list_filter = ('cart',)
    search_fields = ('product__name',)

@admin.register(Order)
class OrderAdmin(admin.ModelAdmin):
    list_display = ('id', 'user', 'order_status', 'payment_status', 'payment_method', 'total_amount', 'created_at')
    list_filter = ('order_status', 'payment_status', 'payment_method', 'created_at')
    search_fields = ('user__email', 'transaction_id', 'phone', 'email')
    readonly_fields = ('created_at', 'updated_at')

@admin.register(OrderItem)
class OrderItemAdmin(admin.ModelAdmin):
    list_display = ('order', 'product', 'quantity', 'price', 'get_total')
    list_filter = ('order',)
    search_fields = ('product__name', 'order__id')

@admin.register(CheckoutSession)
class CheckoutSessionAdmin(admin.ModelAdmin):
    list_display = ('session_id', 'user', 'product', 'quantity', 'is_completed', 'created_at', 'expires_at')
    list_filter = ('is_completed', 'created_at')
    search_fields = ('session_id', 'user__email')
    readonly_fields = ('created_at', 'expires_at', 'session_id')

@admin.register(Contact)
class ContactAdmin(admin.ModelAdmin):
    list_display = ('name', 'email', 'subject', 'created_at')
    list_filter = ('created_at',)
    search_fields = ('name', 'email', 'subject')
    readonly_fields = ('created_at',)

@admin.register(Purchase)
class PurchaseAdmin(admin.ModelAdmin):
    list_display = ('name', 'phone', 'status', 'created_at')
    list_filter = ('status', 'created_at')
    search_fields = ('name', 'phone')
    readonly_fields = ('created_at',)
