from django.urls import path
from . import views
from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    path('', views.home, name='home'),
    path('about/', views.about_view, name='about'),
    path('login/', views.login_view, name='login'),
    path('logout/', views.logout_view, name='logout'),
    path('profile/', views.profile_view, name='profile'),
    path('product/', views.product_view, name='product'),
    path('shop/', views.product_view, name='shop'),  # General shop page
    path('shop/<int:product_id>/', views.product_detail_view, name='shop_detail'),  # Individual product view
    path('base/', views.base, name='base'),
    path('profile/update/', views.update_profile, name='update_profile'),
    path('profile/update-image/', views.update_profile_image, name='update_profile_image'),
    path('profile/add-address/', views.add_address, name='add_address'),
    path('profile/update-address/<int:address_id>/', views.update_address, name='update_address'),
    path('profile/delete-address/<int:address_id>/', views.delete_address, name='delete_address'),
    path('profile/change-password/', views.change_password, name='change_password'),
    path('profile/delete-account/', views.delete_account, name='delete_account'),
    path('product/<int:product_id>/', views.product_detail_view, name='product_detail'),
    path('cart/', views.cart_view, name='cart'),
    path('add-to-cart/<int:product_id>/', views.add_to_cart, name='add_to_cart'),
    path('update-cart-item/', views.update_cart_item, name='update_cart_item'),
    path('remove-cart-item/', views.remove_cart_item, name='remove_cart_item'),
    path('search/', views.search_products, name='search_products'),
    path('checkout/', views.checkout_view, name='checkout'),
    path('api/addresses/', views.manage_address, name='manage_address'),
    path('api/addresses/<int:address_id>/', views.manage_address, name='manage_address_detail'),
    path('send-otp/', views.send_otp, name='send_otp'),
    path('verify-otp/', views.verify_otp_view, name='verify_otp'),
    path('create-payment-order/', views.create_payment_order, name='create_payment_order'),
    path('payment-callback/', views.payment_callback, name='payment_callback'),
    path('order-confirmation/<int:order_id>/', views.order_confirmation_view, name='order_confirmation'),
    path('place-order/', views.place_order, name='place_order'),
] + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
