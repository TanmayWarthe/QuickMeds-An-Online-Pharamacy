from django.urls import path
from . import views

urlpatterns = [
    path('', views.index, name='index'),
    path('orders/', views.orders, name='orders'),
    path('order/<int:order_id>/', views.order_confirmation, name='order_confirmation'),
    path('orders/<int:order_id>/cancel/', views.cancel_order, name='cancel_order'),
]