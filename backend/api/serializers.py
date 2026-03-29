from django.contrib.auth.models import User
from rest_framework import serializers
from .models import Provider, Customer, Service, Order
import json
import uuid
import json

class ProviderCreateSerializer(serializers.ModelSerializer):
    """Handles text data for provider creation (JSON).
    Accepts name & password to create a Django User,
    then links it to the Provider via OneToOneField.
    User.username is set to the Provider UUID.
    """
    name = serializers.CharField(max_length=255)
    password = serializers.CharField(write_only=True)

    class Meta:
        model = Provider
        fields = [
            'uuid', 'onboarding_type', 'name', 'password',
            'age', 'gender', 'location', 'phone_number', 'email',
            'created_at', 'profile_picture', 'legal_id_front', 'legal_id_back',
        ]
        read_only_fields = ['uuid', 'created_at']
        extra_kwargs = {
            'profile_picture': {'required': False, 'allow_null': True},
            'legal_id_front': {'required': False, 'allow_null': True},
            'legal_id_back': {'required': False, 'allow_null': True},
        }

    def validate_phone_number(self, value):
        if not all(char.isdigit() or char in '+-() ' for char in value):
            raise serializers.ValidationError("Invalid phone number format.")
        return value

    def create(self, validated_data):
        name = validated_data.get('name', '')
        password = validated_data.pop('password')
        email = validated_data.get('email', '')
        phone_number = validated_data.get('phone_number', '')

        # Create Provider first to get its UUID
        provider = Provider.objects.create(**validated_data)

        # Create the Django User with UUID as username
        user = User.objects.create_user(
            username=str(provider.uuid),
            email=email,
            password=password,
            first_name=name,
        )

        # Link User to Provider
        provider.user = user
        provider.save(update_fields=['user'])

        # Automatically create Customer profile if it doesn't exist
        if not Customer.objects.filter(user=user).exists():
            Customer.objects.create(
                user=user,
                name=name,
                email=email,
                phone_number=phone_number
            )

        return provider


class ProviderImageUploadSerializer(serializers.Serializer):
    """Handles image uploads for an existing provider (Multipart)."""
    uuid = serializers.UUIDField(required=True)
    profile_picture = serializers.ImageField(required=True)
    legal_id_front = serializers.ImageField(required=True)
    legal_id_back = serializers.ImageField(required=True)

class LoginSerializer(serializers.Serializer):
    """Handles login data."""
    email = serializers.CharField(max_length=255)
    password = serializers.CharField(write_only=True)

class ProviderAIOnboardingSerializer(serializers.Serializer):
    """Handles AI-based provider onboarding.
    Receives extracted_fields (JSON string from LLM extraction),
    password, transcript and images. Creates User + Provider.
    """
    transcript = serializers.CharField(required=True)
    extracted_fields = serializers.CharField(required=True)  # JSON string
    password = serializers.CharField(write_only=True, required=True)
    profile_picture = serializers.ImageField(required=False, allow_null=True)
    legal_id_front = serializers.ImageField(required=False, allow_null=True)
    legal_id_back = serializers.ImageField(required=False, allow_null=True)

    def validate_extracted_fields(self, value):
        
        try:
            parsed = json.loads(value)
        except (json.JSONDecodeError, TypeError):
            raise serializers.ValidationError("extracted_fields must be valid JSON.")
        if not isinstance(parsed, dict):
            raise serializers.ValidationError("extracted_fields must be a JSON object.")
        # Require at minimum a name
        if not parsed.get('name'):
            raise serializers.ValidationError("Extracted fields must include a 'name'.")
        return parsed  # store parsed dict in validated_data

    def create(self, validated_data):
        fields = validated_data['extracted_fields']  # already a dict
        password = validated_data['password']

        print(f"[SERIALIZER] create() called")
        print(f"[SERIALIZER] extracted_fields received: {fields}")
        print(f"[SERIALIZER] password present: {bool(password)}")

        # Coerce None → safe defaults (LLM may return null for missing fields)
        name = fields.get('name') or ''
        age = fields.get('age')
        gender = fields.get('gender') or ''
        location = fields.get('location') or ''
        phone_number = fields.get('phone_number') or ''
        email = fields.get('email') or ''

        print(f"[SERIALIZER] Coerced values:")
        print(f"[SERIALIZER]   name = '{name}'")
        print(f"[SERIALIZER]   age = {age} (type={type(age).__name__})")
        print(f"[SERIALIZER]   gender = '{gender}'")
        print(f"[SERIALIZER]   location = '{location}'")
        print(f"[SERIALIZER]   phone_number = '{phone_number}'")
        print(f"[SERIALIZER]   email = '{email}'")
        print(f"[SERIALIZER]   profile_picture = {validated_data.get('profile_picture')}")
        print(f"[SERIALIZER]   legal_id_front = {validated_data.get('legal_id_front')}")
        print(f"[SERIALIZER]   legal_id_back = {validated_data.get('legal_id_back')}")

        print(f"[SERIALIZER] Creating Provider...")
        provider = Provider.objects.create(
            onboarding_type='ai',
            name=name,
            age=age,
            gender=gender,
            location=location,
            phone_number=phone_number,
            email=email,
            profile_picture=validated_data.get('profile_picture'),
            legal_id_front=validated_data.get('legal_id_front'),
            legal_id_back=validated_data.get('legal_id_back'),
        )
        print(f"[SERIALIZER] Provider created: uuid={provider.uuid}")

        print(f"[SERIALIZER] Creating User with username={provider.uuid}...")
        user = User.objects.create_user(
            username=str(provider.uuid),
            email=email,
            password=password,
            first_name=name,
        )
        print(f"[SERIALIZER] User created: id={user.id}, username={user.username}")

        provider.user = user
        provider.save(update_fields=['user'])
        print(f"[SERIALIZER] Provider.user linked and saved")

        # Automatically create Customer profile if it doesn't exist
        if not Customer.objects.filter(user=user).exists():
            print(f"[SERIALIZER] Creating corresponding Customer profile...")
            Customer.objects.create(
                user=user,
                name=name,
                email=email,
                phone_number=phone_number
            )
            print(f"[SERIALIZER] Customer profile created")

        return provider


class CustomerSerializer(serializers.ModelSerializer):
    """Handles customer registration data.
    Accepts name & password to create a Django User,
    then links it to the Customer via OneToOneField.
    User.username is set to the Customer UUID.
    """
    name = serializers.CharField(max_length=255)
    password = serializers.CharField(write_only=True)

    class Meta:
        model = Customer
        fields = [
            'uuid', 'name', 'password', 'email',
            'phone_number', 'profile_picture', 'created_at',
        ]
        read_only_fields = ['uuid', 'created_at']
        extra_kwargs = {
            'profile_picture': {'required': False, 'allow_null': True},
        }

    def validate_phone_number(self, value):
        if not all(char.isdigit() or char in '+-() ' for char in value):
            raise serializers.ValidationError("Invalid phone number format.")
        return value

    def create(self, validated_data):
        name = validated_data.get('name', '')
        password = validated_data.pop('password')

        # Create Customer first to get its UUID
        customer = Customer.objects.create(**validated_data)

        # Create the Django User with UUID as username
        user = User.objects.create_user(
            username=str(customer.uuid),
            email=validated_data.get('email', ''),
            password=password,
            first_name=name,
        )

        # Link User to Customer
        customer.user = user
        customer.save(update_fields=['user'])
        return customer


class ServiceCreateSerializer(serializers.Serializer):
    """Handles data for service creation."""
    service_title = serializers.CharField(max_length=255)
    service_description = serializers.CharField()
    tags = serializers.CharField(required=False, allow_blank=True)
    service_type = serializers.ChoiceField(choices=[("remote", "Remote"), ("visit", "Visit")])
    price_min = serializers.DecimalField(max_digits=10, decimal_places=2)
    price_max = serializers.DecimalField(max_digits=10, decimal_places=2)

    def validate(self, data):
        if data['price_min'] > data['price_max']:
            raise serializers.ValidationError("Minimum price cannot be greater than maximum price.")
        return data


class ServiceReadSerializer(serializers.ModelSerializer):
    """Handles data for service display."""
    id = serializers.UUIDField(source='uuid', read_only=True)
    tags = serializers.SerializerMethodField()
    images = serializers.SerializerMethodField()
    credentials = serializers.SerializerMethodField()
    price_range = serializers.SerializerMethodField()
    provider_id = serializers.UUIDField(source='provider.uuid')
    provider_name = serializers.CharField(source='provider.name', read_only=True)
    provider_image = serializers.SerializerMethodField()
    location = serializers.CharField(source='provider.location', read_only=True)

    class Meta:
        model = Service
        fields = [
            'id',
            'uuid',
            'title',
            'description',
            'tags',
            'images',
            'credentials',
            'verification_status',
            'price_range',
            'created_at',
            'provider_id',
            'provider_name',
            'provider_image',
            'location'
        ]

    def get_tags(self, obj):
        return [tag.name for tag in obj.tags.all()]

    def get_images(self, obj):
        request = self.context.get('request')
        return [
            request.build_absolute_uri(media.image.url)
            for media in obj.media.all()
        ] if request else []

    def get_credentials(self, obj):
        request = self.context.get('request')
        return [
            {
                "name": cert.name,
                "url": request.build_absolute_uri(cert.file.url)
            }
            for cert in obj.credentials.all()
        ] if request else []

    def get_provider_image(self, obj):
        request = self.context.get('request')
        if not obj.provider.profile_picture:
            return None
        return request.build_absolute_uri(obj.provider.profile_picture.url) if request else None

    def get_price_range(self, obj):
        return f"₹{obj.price_min} - ₹{obj.price_max}"

class CustomerOrderSerializer(serializers.Serializer):
    """Serializer for active orders in the customer dashboard."""
    id = serializers.CharField()
    service_title = serializers.CharField()
    provider_name = serializers.CharField()
    status = serializers.CharField()
    amount = serializers.DecimalField(max_digits=10, decimal_places=2)
    image_url = serializers.URLField(required=False, allow_null=True)
    status_color = serializers.CharField(required=False)

class CustomerActivitySerializer(serializers.Serializer):
    """Serializer for recent activity items."""
    id = serializers.CharField()
    type = serializers.CharField() # message, payment, order
    content = serializers.CharField()
    time_ago = serializers.CharField()
    icon_type = serializers.CharField()

class CustomerStatsSerializer(serializers.Serializer):
    """Serializer for the service overview panel."""
    total_investment = serializers.DecimalField(max_digits=12, decimal_places=2)
    active_projects = serializers.IntegerField()
    saved_experts = serializers.IntegerField()

class CustomerDashboardSerializer(serializers.Serializer):
    """Main serializer for the customer dashboard summary."""
    user_name = serializers.CharField()
    greeting = serializers.CharField()
    active_orders = CustomerOrderSerializer(many=True)
    recent_activity = CustomerActivitySerializer(many=True)
    stats = CustomerStatsSerializer()

class CustomerTransactionSerializer(serializers.Serializer):
    """Serializer for customer transactions."""
    id = serializers.CharField()
    amount = serializers.DecimalField(max_digits=10, decimal_places=2)
    date = serializers.CharField()
    status = serializers.CharField()
    provider_name = serializers.CharField()

class CustomerMessageSerializer(serializers.Serializer):
    """Serializer for customer messages."""
    id = serializers.CharField()
    sender_name = serializers.CharField()
    last_message = serializers.CharField()
    time = serializers.CharField()
    unread_count = serializers.IntegerField(default=0)

class DiscoverServicesSerializer(serializers.Serializer):
    """Serializer for grouped discovery services."""
    featured = ServiceReadSerializer(many=True)
    trending = ServiceReadSerializer(many=True)
    recommended = ServiceReadSerializer(many=True)


class OrderSerializer(serializers.ModelSerializer):
    """Serializer for creating and reading Order records.
    customer, provider, and service are injected via save() in the view.
    """

    class Meta:
        model = Order
        fields = [
            'order_id', 'customer', 'provider',
            'service', 'price', 'discount',
            'delivery_days', 'revisions', 'signature',
            'status', 'created_at', 'updated_at',
        ]
        read_only_fields = ['order_id', 'customer', 'provider', 'service', 'status', 'created_at', 'updated_at']

