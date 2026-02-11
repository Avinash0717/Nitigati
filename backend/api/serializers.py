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
    """Handles AI-based provider onboarding data collection."""
    onboarding_type = serializers.ChoiceField(choices=[('ai', 'ai')], default='ai')
    transcript = serializers.CharField(required=True)
    profile_picture = serializers.ImageField(required=True)
    legal_id_front = serializers.ImageField(required=True)
    legal_id_back = serializers.ImageField(required=True)


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
