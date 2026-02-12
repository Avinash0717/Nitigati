from django.contrib.auth.models import User
from rest_framework import serializers
from .models import Provider, Customer


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

        # Create Provider first to get its UUID
        provider = Provider.objects.create(**validated_data)

        # Create the Django User with UUID as username
        user = User.objects.create_user(
            username=str(provider.uuid),
            email=validated_data.get('email', ''),
            password=password,
            first_name=name,
        )

        # Link User to Provider
        provider.user = user
        provider.save(update_fields=['user'])
        return provider


class ProviderImageUploadSerializer(serializers.Serializer):
    """Handles image uploads for an existing provider (Multipart)."""
    uuid = serializers.UUIDField(required=True)
    profile_picture = serializers.ImageField(required=True)
    legal_id_front = serializers.ImageField(required=True)
    legal_id_back = serializers.ImageField(required=True)


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
        import json
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
