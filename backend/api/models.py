import os
from django.db import models
from uuid import uuid4
from django.contrib.auth.models import User
from django.conf import settings
from django.core.exceptions import ValidationError
from django.db.models.signals import post_save
from django.dispatch import receiver
from django.db.models.signals import post_save
from django.dispatch import receiver


class UserPreference(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='preferences')
    last_active_role = models.CharField(max_length=20, choices=[('customer', 'Customer'), ('provider', 'Provider')], default='customer')

    def __str__(self):
        return f"{self.user.email} - {self.last_active_role}"

def provider_image_path(instance, filename):
	"""Save provider images under providers/<uuid>/<filename>."""
	return os.path.join('media/providers', str(instance.uuid), filename)


# Create your models here.
class Provider(models.Model):
    uuid = models.UUIDField(default=uuid4, editable=False, unique=True, primary_key=True)
    onboarding_type = models.CharField(max_length=20)
    user = models.OneToOneField(User, on_delete=models.CASCADE, null=True, related_name='provider_profile')
    name = models.CharField(max_length=255)
    age = models.IntegerField(null=True, blank=True)
    gender = models.CharField(max_length=10, blank=True, default='')
    location = models.CharField(max_length=255, blank=True, default='')
    phone_number = models.CharField(max_length=20, blank=True, default='')
    email = models.EmailField(max_length=255, blank=True, default='')
    created_at = models.DateTimeField(auto_now_add=True)
    profile_picture = models.ImageField(upload_to=provider_image_path, blank=True, null=True)
    legal_id_front = models.ImageField(upload_to=provider_image_path, blank=True, null=True)
    legal_id_back = models.ImageField(upload_to=provider_image_path, blank=True, null=True)

    def __str__(self):
        return self.name

def customer_image_path(instance, filename):
	"""Save customer images under customers/<uuid>/<filename>."""
	return os.path.join('media/customers', str(instance.uuid), filename)


class Customer(models.Model):
    uuid = models.UUIDField(default=uuid4, editable=False, unique=True, primary_key=True)
    user = models.OneToOneField(User, on_delete=models.CASCADE, null=True, related_name='customer_profile')
    name = models.CharField(max_length=255)
    email = models.EmailField(max_length=255)
    phone_number = models.CharField(max_length=20)
    profile_picture = models.ImageField(upload_to=customer_image_path, blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name

class Tag(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid4, editable=False)
    name = models.CharField(unique=True, max_length=100)

    def save(self, *args, **kwargs):
        if self.name:
            self.name = self.name.lower()
        super().save(*args, **kwargs)

    def __str__(self):
        return self.name if self.name else "Unnamed Tag"

class Service(models.Model):
    VERIFICATION_STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('verified', 'Verified'),
        ('rejected', 'Rejected')
    ]
    SERVICE_TYPE_CHOICES = [
        ('remote', 'Remote'),
        ('visit', 'Visit')
    ]
        
    uuid = models.UUIDField(default=uuid4, editable=False, unique=True, primary_key=True)
    provider = models.ForeignKey(Provider, on_delete=models.CASCADE, related_name='services')
    title = models.CharField(max_length=255)
    description = models.TextField()
    tags = models.ManyToManyField(Tag, related_name='services', blank=True)
    service_type = models.CharField(max_length=20, choices=SERVICE_TYPE_CHOICES)
    verification_status = models.CharField(max_length=20, choices=VERIFICATION_STATUS_CHOICES, default='pending')
    is_active = models.BooleanField(default=True)
    price_min = models.DecimalField(max_digits=10, decimal_places=2)
    price_max = models.DecimalField(max_digits=10, decimal_places=2)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['service_type']),
            models.Index(fields=['verification_status']),
            models.Index(fields=['created_at']),
        ]

    def clean(self):
        if self.price_min > self.price_max:
            raise ValidationError("Minimum price cannot be greater than maximum price.")

    def save(self, *args, **kwargs):
        self.full_clean()
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.title} ({self.provider})"

class ServiceMedia(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid4, editable=False)
    service = models.ForeignKey(Service, related_name='media', on_delete=models.CASCADE)
    image = models.ImageField(upload_to='media/services/media/')

    def __str__(self):
        return f"{self.service.title} - Media"

class ServiceCredential(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid4, editable=False)
    service = models.ForeignKey(Service, related_name='credentials', on_delete=models.CASCADE)
    file = models.FileField(upload_to='media/services/credentials/')
    name = models.CharField(max_length=255, blank=True, null=True)

    def __str__(self):
        return self.name if self.name else f"Credential for {self.service.title}"