import os
from django.db import models
from uuid import uuid4
from django.contrib.auth.models import User

def provider_image_path(instance, filename):
	"""Save provider images under providers/<uuid>/<filename>."""
	return os.path.join('media/providers', str(instance.uuid), filename)


# Create your models here.
class Provider(models.Model):
	#	'uuid', 'onboarding_type', 'name', 'age', 'gender', 
    #            'location', 'phone_number', 'email', 'password', 'created_at',
    #            'profile_picture', 'legal_id_front', 'legal_id_back', 'images_uploaded'

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


class Service(models.Model):
	uuid = models.UUIDField(default=uuid4, editable=False, unique=True, primary_key=True)
	title = models.CharField(max_length=255)
	description = models.TextField()
	tags = models.CharField(max_length=255, blank=True, default='')
	type = models.CharField(max_length=20, choices=[('remote', 'Remote'), ('visit', 'Visit')])
	price_min = models.DecimalField(max_digits=10, decimal_places=2)
	price_max = models.DecimalField(max_digits=10, decimal_places=2)
	created_at = models.DateTimeField(auto_now_add=True)
	images_uploaded = models.BooleanField(default=False)

	def __str__(self):
		return self.title