from django import forms
from .models import Contact, Product, Category, Order
from django.core.validators import MinValueValidator
from decimal import Decimal

class ContactForm(forms.ModelForm):
    class Meta:
        model = Contact
        fields = ['name', 'email', 'phone', 'subject', 'message']


# ==================== ADMIN FORMS ====================

class ProductAdminForm(forms.ModelForm):
    """Form for adding/editing products in admin panel"""
    
    class Meta:
        model = Product
        fields = [
            'name', 'description', 'category', 'price', 
            'original_price', 'stock', 'image', 'in_stock'
        ]
        widgets = {
            'name': forms.TextInput(attrs={
                'class': 'form-control',
                'placeholder': 'Enter product name',
                'required': True
            }),
            'description': forms.Textarea(attrs={
                'class': 'form-control',
                'placeholder': 'Enter product description',
                'rows': 4
            }),
            'category': forms.Select(attrs={
                'class': 'form-control',
                'required': True
            }),
            'price': forms.NumberInput(attrs={
                'class': 'form-control',
                'placeholder': '0.00',
                'step': '0.01',
                'min': '0',
                'required': True
            }),
            'original_price': forms.NumberInput(attrs={
                'class': 'form-control',
                'placeholder': '0.00 (optional)',
                'step': '0.01',
                'min': '0'
            }),
            'stock': forms.NumberInput(attrs={
                'class': 'form-control',
                'placeholder': '0',
                'min': '0',
                'required': True
            }),
            'image': forms.FileInput(attrs={
                'class': 'form-control',
                'accept': 'image/*'
            }),
            'in_stock': forms.CheckboxInput(attrs={
                'class': 'form-check-input'
            })
        }
        labels = {
            'name': 'Product Name',
            'description': 'Description',
            'category': 'Category',
            'price': 'Price (₹)',
            'original_price': 'Original Price (₹)',
            'stock': 'Stock Quantity',
            'image': 'Product Image',
            'in_stock': 'Available for Sale'
        }
        help_texts = {
            'original_price': 'Leave empty if no discount',
            'stock': 'Number of items available',
            'in_stock': 'Uncheck to hide product from customers'
        }
    
    def clean_price(self):
        price = self.cleaned_data.get('price')
        if price and price <= 0:
            raise forms.ValidationError('Price must be greater than 0')
        return price
    
    def clean_original_price(self):
        original_price = self.cleaned_data.get('original_price')
        price = self.cleaned_data.get('price')
        
        if original_price and price:
            if original_price <= price:
                raise forms.ValidationError('Original price must be greater than current price')
        
        return original_price
    
    def clean_stock(self):
        stock = self.cleaned_data.get('stock')
        if stock and stock < 0:
            raise forms.ValidationError('Stock cannot be negative')
        return stock
    
    def clean_image(self):
        image = self.cleaned_data.get('image')
        
        if image:
            # Check file size (max 5MB)
            if image.size > 5 * 1024 * 1024:
                raise forms.ValidationError('Image file size must be less than 5MB')
            
            # Check file extension
            allowed_extensions = ['jpg', 'jpeg', 'png', 'webp']
            ext = image.name.split('.')[-1].lower()
            if ext not in allowed_extensions:
                raise forms.ValidationError(f'Only {", ".join(allowed_extensions)} files are allowed')
        
        return image


class CategoryAdminForm(forms.ModelForm):
    """Form for adding/editing categories in admin panel"""
    
    class Meta:
        model = Category
        fields = ['name', 'description', 'image']
        widgets = {
            'name': forms.TextInput(attrs={
                'class': 'form-control',
                'placeholder': 'Enter category name',
                'required': True
            }),
            'description': forms.Textarea(attrs={
                'class': 'form-control',
                'placeholder': 'Enter category description (optional)',
                'rows': 3
            }),
            'image': forms.FileInput(attrs={
                'class': 'form-control',
                'accept': 'image/*'
            })
        }
        labels = {
            'name': 'Category Name',
            'description': 'Description',
            'image': 'Category Image'
        }
        help_texts = {
            'image': 'Upload a square image (e.g., 500x500px) for best results. Accepts JPG, PNG, WebP formats.'
        }
    
    def clean_name(self):
        name = self.cleaned_data.get('name')
        
        # Check if category with this name already exists (excluding current instance)
        if self.instance.pk:
            if Category.objects.filter(name__iexact=name).exclude(pk=self.instance.pk).exists():
                raise forms.ValidationError('A category with this name already exists')
        else:
            if Category.objects.filter(name__iexact=name).exists():
                raise forms.ValidationError('A category with this name already exists')
        
        return name


class OrderStatusForm(forms.ModelForm):
    """Form for updating order status"""
    
    class Meta:
        model = Order
        fields = ['order_status', 'payment_status']
        widgets = {
            'order_status': forms.Select(attrs={
                'class': 'form-control'
            }),
            'payment_status': forms.Select(attrs={
                'class': 'form-control'
            })
        }

