from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status
from .models import Provider, Customer
from .serializers import ProviderCreateSerializer, ProviderImageUploadSerializer, CustomerSerializer

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
