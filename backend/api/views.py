from django.shortcuts import get_object_or_404
from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status
from django.contrib.auth import authenticate
from django.contrib.auth.models import User
from django.contrib.auth import authenticate
from .models import Provider, Customer, Tag, Service, ServiceMedia, ServiceCredential
import json
from .serializers import (
    ProviderCreateSerializer, ProviderImageUploadSerializer, 
    CustomerSerializer, ProviderAIOnboardingSerializer,
    ServiceCreateSerializer, ServiceReadSerializer
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

@api_view(['POST'])
def login(request):
    """
    POST /api/login/
    Body: { "email": "...", "password": "..." }
    Authenticates against Django User model (unified for Provider and Customer).
    Returns 200 with user role and uuid on success.
    """
    email = request.data.get('email', '').strip()
    password = request.data.get('password', '')

    if not email or not password:
        return Response(
            {"detail": "Email and password are required."},
            status=status.HTTP_400_BAD_REQUEST
        )
    user = get_object_or_404(User, email=email)
    if not user.check_password(request.data['password']):
        return Response(
            {"detail": "Invalid email or password."},
            status=status.HTTP_401_UNAUTHORIZED
        )
    token, _ = Token.objects.get_or_create(user=user) # type: ignore ; token, created
    return Response({
        "token": token.key,
        "uuid": str(user.username),
        "role": "provider" if hasattr(user, 'provider') else "customer"
    }, status=status.HTTP_200_OK)

@api_view(['GET'])
def logout(request):
    """
    pass
    """
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
        
        return Response(
            {
                "uuid": str(customer.uuid),
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

        return Response(
            {
                "uuid": str(provider.uuid),
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
def provider_dashboard_summary(request):
    """
    GET /api/provider-dashboard/summary/
    Returns a structured summary object for the provider dashboard.
    """
    # In a real app, we would fetch the current authenticated provider
    # For now, we return mock stats based on the UI design requirements.
    
    summary_data = {
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
    Returns 200 with user role and uuid on success.
    """
    email = request.data.get('email', '').strip()
    password = request.data.get('password', '')

    if not email or not password:
        return Response(
            {"detail": "Email and password are required."},
            status=status.HTTP_400_BAD_REQUEST
        )

    # Django's authenticate() uses username, but we store email as username
    
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

    # Determine role
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

    token, _ = Token.objects.get_or_create(user=user)
    
    return Response(
        {
            "message": "Login successful.",
            "role": role,
            "uuid": uuid,
            "token": token.key,
            "email": email,
            "name": user.first_name or user.username,
        },
        status=status.HTTP_200_OK
    )

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
    Returns full details for a single service belonging to the authenticated provider.
    """
    try:
        provider = request.user.provider_profile
    except Provider.DoesNotExist:
        return Response(
            {"detail": "User is not a registered provider."},
            status=status.HTTP_403_FORBIDDEN
        )

    service = get_object_or_404(
        Service.objects.select_related('provider').prefetch_related('tags', 'media', 'credentials'),
        uuid=uuid,
        provider=provider
    )
    
    serializer = ServiceReadSerializer(service, context={'request': request})
    return Response(serializer.data, status=status.HTTP_200_OK)
