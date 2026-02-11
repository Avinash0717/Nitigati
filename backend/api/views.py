import uuid
from django.utils import timezone
from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status
from .serializers import ProviderCreateSerializer, ProviderImageUploadSerializer, CustomerSerializer
from .utils import (
    save_provider_to_csv, get_provider_from_csv, provider_exists, 
    update_provider_images_in_csv, save_customer_to_csv, customer_exists, make_password
)

@api_view(['POST'])
def provider_create(request):
    """
    POST /api/providers/ (JSON Only)
    1. Validates text fields.
    2. Generates UUID and Timestamp.
    3. Stores initial record with empty image fields and images_uploaded=False.
    """
    serializer = ProviderCreateSerializer(data=request.data)
    if serializer.is_valid():
        email = serializer.validated_data['email']
        
        # Check duplicate email
        if provider_exists(email):
            return Response(
                {"detail": "A provider with this email already exists."},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Prepare data for storage
        data = serializer.validated_data
        data['uuid'] = str(uuid.uuid4())
        data['created_at'] = timezone.now().isoformat()
        
        # Set default empty image placeholders
        data['profile_picture'] = ""
        data['legal_id_front'] = ""
        data['legal_id_back'] = ""
        data['images_uploaded'] = False
        
        # Save to CSV using helper
        save_provider_to_csv(data)
        
        return Response(
            {
                "uuid": data['uuid'],
                "message": "Provider record created. Please upload images to complete registration."
            },
            status=status.HTTP_201_CREATED
        )
    
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['POST'])
def provider_upload_images(request):
    """
    POST /api/providers/upload-images/ (Multipart Only)
    1. Receives images and UUID.
    2. Validates records exist in CSV.
    3. Updates placeholders and sets images_uploaded=True.
    """
    serializer = ProviderImageUploadSerializer(data=request.data)

    if serializer.is_valid():
        provider_uuid = serializer.validated_data['uuid']
        
        # Verify provider exists in CSV
        provider = get_provider_from_csv(provider_uuid)
        if not provider:
            return Response(
                {"detail": "Provider record not found for the given UUID."},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Update placeholders in CSV (mimicking file storage)
        success = update_provider_images_in_csv(
            provider_uuid,
            profile_pic_val="profilePic",
            id_front_val="idFront",
            id_back_val="idBack"
        )
        
        if success:
            return Response(
                {"message": "Images uploaded and registration complete."},
                status=status.HTTP_200_OK
            )
        else:
            return Response(
                {"detail": "Failed to update provider images."},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
            
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['GET'])
def provider_detail(request, uuid):
    """
    GET /api/providers/<uuid:uuid>/
    Retrieves provider data from CSV using FBV.
    """
    provider = get_provider_from_csv(uuid)
    
    if provider:
        # Exclude password from response
        provider_data = dict(provider)
        provider_data.pop('password', None)
        return Response(provider_data, status=status.HTTP_200_OK)
        
    return Response(
        {"detail": "Provider not found."},
        status=status.HTTP_404_NOT_FOUND
    )

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
        if customer_exists(email):
            return Response(
                {"email": ["A customer with this email already exists."]},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Prepare data for storage
        data = serializer.validated_data
        
        # Hash password using Django's make_password
        raw_password = data.pop('password')
        data['password'] = make_password(raw_password)
        
        # Generate UUID and Timestamp
        data['uuid'] = str(uuid.uuid4())
        data['created_at'] = timezone.now().isoformat()
        
        # Replace image object with placeholder string for CSV
        # (The actual image file would be handled by a storage backend in a real app)
        if data.get('profile_picture'):
            data['profile_picture'] = "profilePic"
        else:
            data['profile_picture'] = ""
            
        # Save to CSV using helper
        save_customer_to_csv(data)
        
        return Response(
            {
                "uuid": data['uuid'],
                "message": "Customer created successfully"
            },
            status=status.HTTP_201_CREATED
        )
    
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
