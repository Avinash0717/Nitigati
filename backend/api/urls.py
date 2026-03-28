from django.urls import path
from . import views

urlpatterns = [
    path('login', views.login),
    path('logout', views.logout),
    path('verify_token', views.test_token),
    path('switch-role/', views.switch_role, name='switch-role'),
    path("providers/", views.provider_create, name="provider-create"),
    path("providers/upload-images/", views.provider_upload_images, name="provider-upload-images"),
    path("providers/<uuid:uuid>/", views.provider_detail, name="provider-detail"),
    path("providers/ai-onboarding/", views.provider_ai_onboarding, name="provider-ai-onboarding"),
    path("customers/", views.customer_create, name="customer-create"),
    path("provider-dashboard/summary/", views.provider_dashboard_summary, name="provider-dashboard-summary"),
    path("login/", views.login, name="login"),
    path("services/create/", views.service_create, name="service-create"),
    path("services/", views.provider_services_list, name="provider-services-list"),
    path("services/<uuid:uuid>/", views.service_detail, name="service-detail"),
    
    # Customer Dashboard
    path("customer/dashboard/", views.customer_dashboard_summary, name="customer-dashboard-summary"),
    path("customer/orders/", views.customer_orders_list, name="customer-orders-list"),
    path("customer/transactions/", views.customer_transactions_list, name="customer-transactions-list"),
    path("customer/messages/", views.customer_messages_list, name="customer-messages-list"),
    path("customer/discover-services/", views.customer_discover_services_list, name="customer-discover-services-list"),
]
