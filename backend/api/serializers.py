from rest_framework import serializers

class ProviderCreateSerializer(serializers.Serializer):
    """Handles text data for provider creation (JSON)."""
    uuid = serializers.UUIDField(read_only=True)
    onboarding_type = serializers.ChoiceField(choices=[('manual', 'manual'), ('ai', 'ai')])
    name = serializers.CharField(max_length=255)
    age = serializers.IntegerField(min_value=1)
    gender = serializers.CharField(max_length=50)
    location = serializers.CharField(max_length=255)
    phone_number = serializers.CharField(max_length=20)
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True)
    created_at = serializers.DateTimeField(read_only=True)

    def validate_phone_number(self, value):
        if not all(char.isdigit() or char in '+-() ' for char in value):
            raise serializers.ValidationError("Invalid phone number format.")
        return value

class ProviderImageUploadSerializer(serializers.Serializer):
    """Handles image uploads for an existing provider (Multipart)."""
    uuid = serializers.UUIDField(required=True)
    profile_picture = serializers.ImageField(required=True)
    legal_id_front = serializers.ImageField(required=True)
    legal_id_back = serializers.ImageField(required=True)

class CustomerSerializer(serializers.Serializer):
    """Handles customer registration data."""
    uuid = serializers.UUIDField(read_only=True)
    username = serializers.CharField(max_length=150)
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True)
    phone_number = serializers.CharField(max_length=20)
    profile_picture = serializers.ImageField(required=False, allow_null=True)
    created_at = serializers.DateTimeField(read_only=True)

    def validate_phone_number(self, value):
        if not all(char.isdigit() or char in '+-() ' for char in value):
            raise serializers.ValidationError("Invalid phone number format.")
        return value
