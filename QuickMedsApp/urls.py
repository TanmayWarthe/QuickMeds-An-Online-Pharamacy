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
    path('profile/update/', views.update_profile, name='update_profile'),
    path('profile/update-image/', views.update_profile_image, name='update_profile_image'),
    path('profile/add-address/', views.add_address, name='add_address'),
    path('profile/update-address/<int:address_id>/', views.update_address, name='update_address'),
    path('profile/delete-address/<int:address_id>/', views.delete_address, name='delete_address'),
    path('profile/change-password/', views.change_password, name='change_password'),
    path('profile/delete-account/', views.delete_account, name='delete_account'),
    path('product/', views.product_view, name='product'),
    path('product/<int:product_id>/', views.product_detail_view, name='product_detail'),
    path('about/', views.about_view, name='about'),
    path('cart/', views.cart_view, name='cart'),
    path('add-to-cart/', views.add_to_cart, name='add_to_cart'),
    path('update-cart-item/', views.update_cart_item, name='update_cart_item'),
    path('remove-cart-item/', views.remove_cart_item, name='remove_cart_item'),
    path('shop/<int:product_id>/', views.shop_view, name='shop'),
    path('search/', views.search_products, name='search_products'),
    path('checkout/', views.checkout_view, name='checkout'),
    path('api/addresses/', views.manage_address, name='manage_address'),
    path('api/addresses/<int:address_id>/', views.manage_address, name='manage_address_detail'),
] + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)