from django.contrib import admin 
from django.urls import path , include
from . import views
from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    path('', views.home, name='home'),
    path('base/', views.base, name='base'),
    path('login/', views.login_view, name='login'),
    path('logout/', views.logout_view, name='logout'),
    path('profile/', views.profile_view, name='profile'),
    path('product/', views.product_view, name='product'),
    path('about/', views.about_view, name='about'),
    path('cart/', views.cart_view, name='cart'),
    path('add-to-cart/', views.add_to_cart, name='add_to_cart'),
    path('update-cart/', views.update_cart_item, name='update_cart_item'),
    path('remove-cart-item/', views.remove_cart_item, name='remove_cart_item'),
    path('shop/', views.shop_view, name='shop'),
    path('search/', views.search_products, name='search_products'),
    path('checkout/', views.checkout_view, name='checkout'),
] + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)