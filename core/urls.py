from django.urls import path
from . import views

urlpatterns = [
    path('', views.dashboard, name='dashboard'),
    path('vehicle/add/', views.add_vehicle, name='add_vehicle'),
    path('refueling/add//', views.add_refueling, name='add_refueling'),
]