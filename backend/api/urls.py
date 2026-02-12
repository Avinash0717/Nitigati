from django.urls import path
from . import views

urlpatterns = [
    path("providers/", views.provider_create, name="provider-create"),
    path("providers/upload-images/", views.provider_upload_images, name="provider-upload-images"),
    path("providers/<uuid:uuid>/", views.provider_detail, name="provider-detail"),
    path("providers/ai-onboarding/", views.provider_ai_onboarding, name="provider-ai-onboarding"),
    path("customers/", views.customer_create, name="customer-create"),
    path("login/", views.login_view, name="login"),
]
