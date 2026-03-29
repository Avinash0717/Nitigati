from django.shortcuts import get_object_or_404
from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status
from django.contrib.auth import authenticate
from django.contrib.auth.models import User
from .models import Provider, Customer, Tag, Service, ServiceMedia, ServiceCredential, UserPreference
import json
from .serializers import (
    ProviderCreateSerializer, ProviderImageUploadSerializer, 
    CustomerSerializer, ProviderAIOnboardingSerializer,
    ServiceCreateSerializer, ServiceReadSerializer,
    CustomerDashboardSerializer, CustomerOrderSerializer,
    CustomerTransactionSerializer, CustomerMessageSerializer,
    DiscoverServicesSerializer
)
from rest_framework.authtoken.models import Token # type: ignore
from rest_framework.authentication import SessionAuthentication, TokenAuthentication # type: ignore
from rest_framework.permissions import IsAuthenticated # type: ignore
from rest_framework.decorators import authentication_classes, permission_classes, parser_classes # type: ignore

@api_view(['POST'])
def provider_create(request):
    """
    POST /api/providers/ (JSON Only)
    1. Validates text fields.
    2. Creates a Django User and links it to the Provider.
    3. Stores initial record with empty image fields.
    3. returns session token and provider UUID for next steps.
    """
    serializer = ProviderCreateSerializer(data=request.data)
    if serializer.is_valid():
        email = serializer.validated_data['email']
        
        # Check duplicate email
        if Provider.objects.filter(email=email).exists():
            return Response(
                {"detail": "A provider with this email already exists."},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Save to DB — creates User + Provider in serializer.create()
        provider = serializer.save()
        token = Token.objects.create(user=provider.user)  # type: ignore
        return Response(
            {
                "token": token.key,
                "uuid": str(provider.uuid),
                "message": "Provider record created. Please upload images to complete registration."
            },
            status=status.HTTP_201_CREATED
        )
    print(serializer.errors)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['POST'])
def provider_upload_images(request):
    """
    POST /api/providers/upload-images/ (Multipart Only)
    1. Receives images and UUID.
    2. Validates provider exists in DB.
    3. Updates image fields on the Provider model.
    """
    serializer = ProviderImageUploadSerializer(data=request.data)

    if serializer.is_valid():
        provider_uuid = serializer.validated_data['uuid']
        
        try:
            provider = Provider.objects.get(uuid=provider_uuid)
        except Provider.DoesNotExist:
            return Response(
                {"detail": "Provider record not found for the given UUID."},
                status=status.HTTP_404_NOT_FOUND
            )
        
        provider.profile_picture = serializer.validated_data['profile_picture']
        provider.legal_id_front = serializer.validated_data['legal_id_front']
        provider.legal_id_back = serializer.validated_data['legal_id_back']
        provider.save(update_fields=['profile_picture', 'legal_id_front', 'legal_id_back'])
        token = Token.objects.create(user=provider.user)  # type: ignore
        return Response(
            {"message": "Images uploaded and registration complete.", "token": token.key},
            status=status.HTTP_200_OK
        )
            
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET'])
@authentication_classes([SessionAuthentication, TokenAuthentication])
@permission_classes([IsAuthenticated])
def logout(request):
    """
    pass
    """
    # delete the token to force re-authentication
    try:
        request.user.auth_token.delete()  # type: ignore
    except (AttributeError, Token.DoesNotExist):
        pass
    
    return Response({}, status=status.HTTP_200_OK)

@api_view(['GET'])
@authentication_classes([SessionAuthentication, TokenAuthentication])
@permission_classes([IsAuthenticated])
def test_token(request):
	return Response({'detail': 'Token is valid'}, status=status.HTTP_200_OK)



@api_view(['GET'])
def provider_detail(request, uuid):
    """
    GET /api/providers/<uuid:uuid>/
    Retrieves provider data from DB.
    """
    try:
        provider = Provider.objects.get(uuid=uuid)
    except Provider.DoesNotExist:
        return Response(
            {"detail": "Provider not found."},
            status=status.HTTP_404_NOT_FOUND
        )
    
    return Response({
        'uuid': str(provider.uuid),
        'onboarding_type': provider.onboarding_type,
        'name': provider.name,
        'age': provider.age,
        'gender': provider.gender,
        'location': provider.location,
        'phone_number': provider.phone_number,
        'email': provider.email,
        'created_at': provider.created_at.isoformat(),
    }, status=status.HTTP_200_OK)

@api_view(['POST'])
def customer_create(request):
    """
    POST /api/customers/ (Multipart/form-data)
    Handles customer registration with image.
    """
    serializer = CustomerSerializer(data=request.data)
    if serializer.is_valid():
        email = serializer.validated_data['email']
        
        # Check duplicate email
        if Customer.objects.filter(email=email).exists():
            return Response(
                {"email": ["A customer with this email already exists."]},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Save to DB — creates User + Customer in serializer.create()
        customer = serializer.save()
        
        token = Token.objects.create(user=customer.user)  # type: ignore ; token, created

        return Response(
            {

                "uuid": str(customer.uuid),
                "token": token.key,
                "message": "Customer created successfully"
            },
            status=status.HTTP_201_CREATED
        )
    print(serializer.errors)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['POST'])
def provider_ai_onboarding(request):
    """
    POST /api/providers/ai-onboarding/ (Multipart/form-data)
    Creates a Provider + User from AI-extracted fields, password, and images.
    """
    print("\n" + "="*80)
    print("[AI ONBOARDING] ===== REQUEST RECEIVED =====")
    print(f"[AI ONBOARDING] Content-Type: {request.content_type}")
    print(f"[AI ONBOARDING] Method: {request.method}")
    print(f"[AI ONBOARDING] Raw data keys: {list(request.data.keys())}")
    for key in request.data:
        val = request.data[key]
        if hasattr(val, 'name'):  # file
            print(f"[AI ONBOARDING]   {key} = <File: {val.name}, size={val.size}>")
        else:
            print(f"[AI ONBOARDING]   {key} = {str(val)[:200]}")
    print("="*80)

    serializer = ProviderAIOnboardingSerializer(data=request.data)
    print(f"[AI ONBOARDING] Serializer created: {type(serializer).__name__}")

    is_valid = serializer.is_valid()
    print(f"[AI ONBOARDING] is_valid() = {is_valid}")

    if is_valid:
        vd = serializer.validated_data
        print(f"[AI ONBOARDING] validated_data keys: {list(vd.keys())}")
        print(f"[AI ONBOARDING] transcript (first 100): {str(vd.get('transcript', ''))[:100]}")
        print(f"[AI ONBOARDING] extracted_fields type: {type(vd.get('extracted_fields'))}")
        extracted = vd.get('extracted_fields', {})
        print(f"[AI ONBOARDING] extracted_fields: {extracted}")
        print(f"[AI ONBOARDING] password present: {bool(vd.get('password'))}")
        print(f"[AI ONBOARDING] profile_picture: {vd.get('profile_picture')}")
        print(f"[AI ONBOARDING] legal_id_front: {vd.get('legal_id_front')}")
        print(f"[AI ONBOARDING] legal_id_back: {vd.get('legal_id_back')}")

        email = extracted.get('email', '') or ''
        print(f"[AI ONBOARDING] email from extracted: '{email}'")

        # Check duplicate email
        if email:
            dup = Provider.objects.filter(email=email).exists()
            print(f"[AI ONBOARDING] duplicate email check: exists={dup}")
            if dup:
                print(f"[AI ONBOARDING] REJECTED — duplicate email: {email}")
                return Response(
                    {"detail": "A provider with this email already exists."},
                    status=status.HTTP_400_BAD_REQUEST
                )

        print(f"[AI ONBOARDING] Calling serializer.save()...")
        try:
            provider = serializer.save()
        except Exception as e:
            print(f"[AI ONBOARDING] ERROR in serializer.save(): {e}")
            import traceback
            traceback.print_exc()
            return Response(
                {"detail": f"Failed to create provider: {e}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

        print(f"[AI ONBOARDING] Provider CREATED successfully!")
        print(f"[AI ONBOARDING]   uuid: {provider.uuid}")
        print(f"[AI ONBOARDING]   name: {provider.name}")
        print(f"[AI ONBOARDING]   age: {provider.age}")
        print(f"[AI ONBOARDING]   gender: {provider.gender}")
        print(f"[AI ONBOARDING]   location: {provider.location}")
        print(f"[AI ONBOARDING]   phone_number: {provider.phone_number}")
        print(f"[AI ONBOARDING]   email: {provider.email}")
        print(f"[AI ONBOARDING]   onboarding_type: {provider.onboarding_type}")
        print(f"[AI ONBOARDING]   user: {provider.user}")
        print(f"[AI ONBOARDING]   user.username: {provider.user.username if provider.user else 'N/A'}")
        print(f"[AI ONBOARDING]   profile_picture: {provider.profile_picture}")
        print(f"[AI ONBOARDING]   legal_id_front: {provider.legal_id_front}")
        print(f"[AI ONBOARDING]   legal_id_back: {provider.legal_id_back}")
        print(f"[AI ONBOARDING]   created_at: {provider.created_at}")
        print("="*80 + "\n")

        token, _ = Token.objects.get_or_create(user=provider.user)  # type: ignore

        return Response(
            {
                "uuid": str(provider.uuid),
                "token": token.key,
                "message": "AI onboarding complete. Provider created successfully."
            },
            status=status.HTTP_201_CREATED
        )

    print(f"[AI ONBOARDING] VALIDATION FAILED")
    print(f"[AI ONBOARDING] errors: {serializer.errors}")
    for field, errs in serializer.errors.items():
        print(f"[AI ONBOARDING]   {field}: {errs}")
    print("="*80 + "\n")
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['GET'])
@authentication_classes([TokenAuthentication])
@permission_classes([IsAuthenticated])
def provider_dashboard_summary(request):
    """
    GET /api/provider-dashboard/summary/
    Returns a structured summary object for the provider dashboard.
    """
    # In a real app, we would fetch the current authenticated provider
    # For now, we return mock stats based on the UI design requirements.
    
    summary_data = {
        "user_name": request.user.first_name or request.user.username,
        "verification_status": "In Progress",
        "trust_badge": "Rising Talent",
        "trust_badge_detail": "Based on your 98% job success rate and excellent client feedback over the last 2 weeks.",
        "total_earnings": 12840.00,
        "active_orders": 24,
        "provider_rating": 4.92,
        "job_success_rate": 98.4,
        "recent_orders": [
            {
                "id": 1,
                "title": "Corporate Logo Design",
                "client": "GreenTech Solutions",
                "amount": 450.00,
                "status": "In Progress"
            },
            {
                "id": 2,
                "title": "UI/UX Audit",
                "client": "SwiftPay App",
                "amount": 1200.00,
                "status": "Pending Review"
            },
            {
                "id": 3,
                "title": "Mobile Landing Page",
                "client": "Fitness Hub",
                "amount": 320.00,
                "status": "Completed"
            }
        ],
        "earnings_statistics": {
            "this_month": [30, 45, 35, 90, 40, 60, 35],
            "last_month": [20, 30, 40, 30, 50, 40, 30]
        },
        "pending_payout": 2140.50
    }
    
    return Response(summary_data, status=status.HTTP_200_OK)


@api_view(['POST'])
def login(request):
    """
    POST /api/login/
    Body: { "email": "...", "password": "..." }
    Authenticates against Django User model (unified for Provider and Customer).
    Returns 200 with user role, available_roles, and last_active_role on success.
    """
    email = request.data.get('email', '').strip()
    password = request.data.get('password', '')

    if not email or not password:
        return Response(
            {"detail": "Email and password are required."},
            status=status.HTTP_400_BAD_REQUEST
        )

    try:
        user = User.objects.get(email=email)
    except User.DoesNotExist:
        return Response(
            {"detail": "Invalid email or password."},
            status=status.HTTP_401_UNAUTHORIZED
        )

    user = authenticate(username=user.username, password=password)
    if user is None:
        return Response(
            {"detail": "Invalid email or password."},
            status=status.HTTP_401_UNAUTHORIZED
        )

    # Determine available roles
    available_roles = []
    if hasattr(user, 'customer_profile'):
        available_roles.append('customer')
    if hasattr(user, 'provider_profile'):
        available_roles.append('provider')

    # Determine active role and uuid
    role = None
    uuid = None
    if hasattr(user, 'provider_profile'):
        role = 'provider'
        uuid = str(user.provider_profile.uuid)
    elif hasattr(user, 'customer_profile'):
        role = 'customer'
        uuid = str(user.customer_profile.uuid)
    else:
        return Response(
            {"detail": "User has no associated profile."},
            status=status.HTTP_403_FORBIDDEN
        )

    # Dashboard Preference Tracking
    pref, created = UserPreference.objects.get_or_create(user=user)
    if created:
        # Initial fallback: provider if exists, else customer
        pref.last_active_role = 'provider' if hasattr(user, 'provider_profile') else 'customer'
        pref.save()

    token, _ = Token.objects.get_or_create(user=user)
    
    return Response(
        {
            "message": "Login successful.",
            "role": role,
            "uuid": uuid,
            "token": token.key,
            "email": email,
            "name": user.first_name or user.username,
            "available_roles": available_roles,
            "last_active_role": pref.last_active_role
        },
        status=status.HTTP_200_OK
    )

@api_view(['POST'])
@authentication_classes([TokenAuthentication])
@permission_classes([IsAuthenticated])
def switch_role(request):
    """
    POST /api/switch-role/
    Input: { "role": "customer" | "provider" }
    Validates role availability and updates last_active_role preference.
    """
    role = request.data.get('role')
    if role not in ['customer', 'provider']:
        return Response(
            {"detail": "Invalid role selection."},
            status=status.HTTP_400_BAD_REQUEST
        )

    # Validate availability
    if role == 'provider' and not hasattr(request.user, 'provider_profile'):
        return Response(
            {"detail": "Provider profile does not exist. Please complete onboarding first."},
            status=status.HTTP_403_FORBIDDEN
        )
    
    if role == 'customer' and not hasattr(request.user, 'customer_profile'):
        
        return Response(
            {"detail": "Customer profile does not exist."},
            status=status.HTTP_403_FORBIDDEN
        )

    # Update preference
    pref, _ = UserPreference.objects.get_or_create(user=request.user)
    print(pref)
    pref.last_active_role = role
    pref.save()

    return Response({
        "message": f"Successfully switched to {role} role.",
        "role": role
    }, status=status.HTTP_200_OK)

@api_view(['POST'])
@authentication_classes([TokenAuthentication])
@permission_classes([IsAuthenticated])
def service_create(request):
    """
    POST /api/services/create/ (Multipart)
    1. Validates fields via Serializer.
    2. Extracts data: title, description, service_type, price_min, price_max, tags.
    3. Get provider from current authenticated user.
    4. Creates Service, Tags, Media and Credentials record in DB.
    5. Returns success with real service UUID.
    """
    serializer = ServiceCreateSerializer(data=request.data)
    if serializer.is_valid():
        try:
            # 1. Get Data
            title = serializer.validated_data['service_title']
            description = serializer.validated_data['service_description']
            service_type = serializer.validated_data['service_type']
            price_min = serializer.validated_data['price_min']
            price_max = serializer.validated_data['price_max']
            
            # tags arrive as a JSON string from the frontend
            tags_json = serializer.validated_data.get('tags', '[]')
            try:
                tags_list = json.loads(tags_json) if isinstance(tags_json, str) else tags_json
            except (json.JSONDecodeError, TypeError):
                tags_list = []

            # 2. Get Provider
            # Check if user has a provider_profile
            if not hasattr(request.user, 'provider_profile'):
                return Response(
                    {"detail": "User is not a registered provider."},
                    status=status.HTTP_403_FORBIDDEN
                )
            
            provider = request.user.provider_profile

            # 3. Create Service
            service = Service.objects.create(
                provider=provider,
                title=title,
                description=description,
                service_type=service_type,
                price_min=price_min,
                price_max=price_max
            )

            # 4. Handle Tags
            for tag_name in tags_list:
                tag_obj, _ = Tag.objects.get_or_create(name=tag_name.lower())
                service.tags.add(tag_obj)

            # 5. Handle Service Media (Images)
            images = request.FILES.getlist('service_images')
            for image in images:
                ServiceMedia.objects.create(
                    service=service,
                    image=image
                )

            # 6. Handle Service Credentials (Certs)
            certs = request.FILES.getlist('certifications')
            for cert in certs:
                ServiceCredential.objects.create(
                    service=service,
                    file=cert,
                    name=cert.name
                )

            return Response(
                {
                    "message": "Service created successfully",
                    "service_id": str(service.uuid)
                },
                status=status.HTTP_201_CREATED
            )

        except Exception as e:
            # Cleanup optionally or just error out
            return Response(
                {"detail": f"Failed to create service: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['GET'])
@authentication_classes([TokenAuthentication])
@permission_classes([IsAuthenticated])
def provider_services_list(request):
    """
    GET /api/services/
    Returns all services for the current provider.
    """
    try:
        provider = request.user.provider_profile
    except Provider.DoesNotExist:
        return Response(
            {"detail": "User is not a registered provider."},
            status=status.HTTP_403_FORBIDDEN
        )

    services = Service.objects.filter(provider=provider).prefetch_related('tags', 'media')
    
    serializer = ServiceReadSerializer(
        services,
        many=True,
        context={'request': request}
    )
    
    return Response(serializer.data, status=status.HTTP_200_OK)

@api_view(['GET'])
@authentication_classes([TokenAuthentication])
@permission_classes([IsAuthenticated])
def service_detail(request, uuid):
    """
    GET /api/services/<uuid>/
    Returns full details for a single service.
    Customers can access ANY service.
    Providers can ONLY access their own services.
    """
    # 1. Role Detection
    user = request.user
    role = 'customer' # default
    
    try:
        pref = UserPreference.objects.get(user=user)
        print(f"UserPreference found: last_active_role={pref.last_active_role}")
        role = pref.last_active_role
    except UserPreference.DoesNotExist:
        # Fallback: provider if profile exists, else customer
        if hasattr(user, 'provider_profile'):
            role = 'provider'
        else:
            role = 'customer'

    # 2. Access Control
    queryset = Service.objects.prefetch_related('tags', 'media', 'credentials')
    print("++++++++++++++++++++++++++++++++++++++++++++++++++", queryset)
    if role == 'customer':
        print("CUSTOMERRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRR")
        # Unrestricted access to any service by uuid
        service = get_object_or_404(queryset, uuid=uuid)
    else:
        print("PROVIDERRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRR")
        # Provider role
        try:
            provider = user.provider_profile
        except Provider.DoesNotExist:
            return Response(
                {"detail": "User is not a registered provider."},
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Restrict to own services only
        service = get_object_or_404(queryset, uuid=uuid, provider=provider)
    
    serializer = ServiceReadSerializer(service, context={'request': request})
    return Response(serializer.data, status=status.HTTP_200_OK)

@api_view(['GET'])
@authentication_classes([TokenAuthentication])
@permission_classes([IsAuthenticated])
def customer_dashboard_summary(request):
    """
    GET /api/customer/dashboard/
    Returns summary stats for the customer dashboard.
    """
    # In a real app, fetch from DB
    # customer = request.user.customer_profile
    
    data = {
        "user_name": request.user.first_name or "Alex",
        "greeting": "Your digital artisan ecosystem is thriving today.",
        "active_orders": [
            {
                "id": "1",
                "service_title": "Quantum System Audit",
                "provider_name": "Neural Logic Labs",
                "status": "IN PROGRESS",
                "amount": 1240.00,
                "status_color": "emerald" # for UI hints
            },
            {
                "id": "2",
                "service_title": "Brand Identity Overhaul",
                "provider_name": "Studio Zenith",
                "status": "AWAITING CONFIRMATION",
                "amount": 3500.00,
                "status_color": "zinc"
            },
            {
                "id": "3",
                "service_title": "Strategic Tax Planning",
                "provider_name": "Global FinTech",
                "status": "IN PROGRESS",
                "amount": 850.00,
                "status_color": "emerald"
            }
        ],
        "recent_activity": [
            {
                "id": "1",
                "type": "message",
                "content": "New message from Studio Zenith: 'The initial wireframes for the identity overhaul are ready...'",
                "time_ago": "12M AGO",
                "icon_type": "message"
            },
            {
                "id": "2",
                "type": "payment",
                "content": "Payment Verified: Milestone 1 payment for 'Strategic Tax Planning' has been successfully processed.",
                "time_ago": "2H AGO",
                "icon_type": "payment"
            },
            {
                "id": "3",
                "type": "order",
                "content": "Order Completed: 'Quarterly Performance Review' with Alex Artisan was marked as complete.",
                "time_ago": "YESTERDAY",
                "icon_type": "check"
            }
        ],
        "stats": {
            "total_investment": 5590.00,
            "active_projects": 4,
            "saved_experts": 12
        }
    }
    
    serializer = CustomerDashboardSerializer(data)
    return Response(serializer.data)

@api_view(['GET'])
@authentication_classes([TokenAuthentication])
@permission_classes([IsAuthenticated])
def customer_orders_list(request):
    """GET /api/customer/orders/"""
    # For now return empty list as requested for placeholder screens
    return Response([])

@api_view(['GET'])
@authentication_classes([TokenAuthentication])
@permission_classes([IsAuthenticated])
def customer_transactions_list(request):
    """GET /api/customer/transactions/"""
    return Response([])

@api_view(['GET'])
@authentication_classes([TokenAuthentication])
@permission_classes([IsAuthenticated])
def customer_messages_list(request):
    """GET /api/customer/messages/"""
    return Response([])

@api_view(['GET'])
@authentication_classes([TokenAuthentication])
@permission_classes([IsAuthenticated])
def customer_discover_services_list(request):
    """GET /api/customer/discover-services/"""
    # Categorise services for better discovery experience
    all_active = Service.objects.filter(is_active=True).select_related('provider').prefetch_related('tags', 'media')
    
    featured = all_active.filter(verification_status='verified').order_by('-created_at')[:3]
    trending = all_active.order_by('-created_at')[:4]
    recommended = all_active.order_by('?')[:3] # Random fallback for now
    
    data = {
        "featured": featured,
        "trending": trending,
        "recommended": recommended
    }
    
    serializer = DiscoverServicesSerializer(data, context={'request': request})
    return Response(serializer.data)
