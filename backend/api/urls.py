from django.urls import path
from . import views

urlpatterns = [
    path("providers/", views.provider_create, name="provider-create"),
    path("providers/upload-images/", views.provider_upload_images, name="provider-upload-images"),
    path("providers/<uuid:uuid>/", views.provider_detail, name="provider-detail"),
    path("customers/", views.customer_create, name="customer-create"),
]
