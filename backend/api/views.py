from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status
from django.contrib.auth import authenticate
from django.contrib.auth.models import User
from django.contrib.auth import authenticate
from .models import Provider, Customer
from .serializers import (
    ProviderCreateSerializer, ProviderImageUploadSerializer, 
    CustomerSerializer, ProviderAIOnboardingSerializer,
    ServiceCreateSerializer, ServiceReadSerializer
)

# @api_view(['POST'])
# def login_view(request):
#     """
#     POST /api/login/
#     Validates user credentials.
#     """
#     email = request.data.get('email')
#     password = request.data.get('password')
#     keep_me_logged_in = request.data.get('keep_me_logged_in', False)

#     if not email or not password:
#         return Response(
#             {"message": "Email and password are required"},
#             status=status.HTTP_400_BAD_REQUEST
#         )

#     try:
#         user = User.objects.get(email=email)
#     except User.DoesNotExist:
#         return Response(
#             {"message": "Invalid credentials"},
#             status=status.HTTP_401_UNAUTHORIZED
#         )

#     if user.check_password(password):
#         # In a real app, we might create a token or session here
#         return Response(
#             {
#                 "message": "Login successful",
#                 "authenticated": True,
#                 "user_id": user.id
#             },
#             status=status.HTTP_200_OK
#         )
#     else:
#         return Response(
#             {"message": "Invalid credentials"},
#             status=status.HTTP_401_UNAUTHORIZED
#         )

@api_view(['POST'])
def provider_create(request):
    """
    POST /api/providers/ (JSON Only)
    1. Validates text fields.
    2. Creates a Django User and links it to the Provider.
    3. Stores initial record with empty image fields.
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
        
        return Response(
            {
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
        
        return Response(
            {"message": "Images uploaded and registration complete."},
            status=status.HTTP_200_OK
        )
            
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

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

    return Response(
        {
            "message": "Login successful.",
            "role": role,
            "uuid": uuid,
            "email": email,
            "name": user.first_name or user.username,
        },
        status=status.HTTP_200_OK
    )

@api_view(['POST'])
def service_create(request):
    """
    POST /api/services/create/ (Multipart)
    1. Validates fields via Serializer.
    2. Handles multiple image/cert uploads.
    3. Returns success with a mock/real service UUID.
    """
    serializer = ServiceCreateSerializer(data=request.data)
    if serializer.is_valid():
        # In a real app with a model, we would do:
        # service = Service.objects.create(**serializer.validated_data)
        # Handle files...
        
        # Since we assume the model exists but can't touch it:
        service_id = str(uuid.uuid4())
        
        # Log received files for verification
        images = request.FILES.getlist('service_images')
        certs = request.FILES.getlist('certifications')
        
        print(f"[SERVICE CREATE] Title: {serializer.validated_data['service_title']}")
        print(f"[SERVICE CREATE] Images received: {len(images)}")
        print(f"[SERVICE CREATE] Certifications received: {len(certs)}")

        return Response(
            {
                "message": "Service created successfully",
                "service_id": service_id
            },
            status=status.HTTP_201_CREATED
        )
    
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['GET'])
def provider_services_list(request):
    """
    GET /api/services/
    Returns all services for the current provider.
    """
    # Assuming we can filter by provider (mocking for now with sample data)
    services = [
        {
            "id": "11111111-1111-1111-1111-111111111111",
            "title": "Professional Woodworking",
            "tags": ["HOME REPAIR", "WOODWORK"],
            "image": "https://images.unsplash.com/photo-1581141849291-1125c7b692b5?w=400&h=300&fit=crop",
            "verification_status": "Verified",
            "price_range": "₹500 - ₹2,000"
        },
        {
            "id": "22222222-2222-2222-2222-222222222222",
            "title": "Expert Electrical Service",
            "tags": ["ELECTRICAL", "INSTALLATION"],
            "image": "https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=400&h=300&fit=crop",
            "verification_status": "Verified",
            "price_range": "₹800 - ₹5,000"
        },
        {
            "id": "33333333-3333-3333-3333-333333333333",
            "title": "Deep Home Cleaning",
            "tags": ["SANITATION", "HOUSEKEEPING"],
            "image": "https://images.unsplash.com/photo-1581578731548-c64695ce6958?w=400&h=300&fit=crop",
            "verification_status": "Verified",
            "price_range": "₹1,200 - ₹4,500"
        }
    ]
    
    return Response(services, status=status.HTTP_200_OK)

@api_view(['GET'])
def service_detail(request, uuid):
    """
    GET /api/services/<uuid>/
    Returns full details for a single service.
    """
    # Mocking single service detail
    detail = {
        "id": str(uuid),
        "title": "Professional Woodworking",
        "description": "I provide high-quality woodworking services for home maintenance and custom furniture repair. With over 8 years of experience, I ensure precision and durability in every project. My approach combines traditional craftsmanship with modern techniques to deliver exceptional results.",
        "tags": ["HOME REPAIR", "WOODWORK", "RENOVATION"],
        "images": [
            "https://images.unsplash.com/photo-1581141849291-1125c7b692b5?w=800&h=600&fit=crop",
            "https://images.unsplash.com/photo-1552330614-3709dec866a1?w=800&h=600&fit=crop",
            "https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=800&h=600&fit=crop"
        ],
        "verification_status": "Verified",
        "price_range": "₹500 - ₹2,000",
        "provider_id": "99999999-9999-9999-9999-999999999999",
        "created_at": "2024-01-01T00:00:00Z"
    }
    
    return Response(detail, status=status.HTTP_200_OK)
