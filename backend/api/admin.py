from django.contrib import admin
from api.models import Provider, Customer, Tag, Service, ServiceMedia, ServiceCredential
# Register your models here.

admin.site.register(Provider)
admin.site.register(Customer)
admin.site.register(Tag)
admin.site.register(Service)
admin.site.register(ServiceMedia)
admin.site.register(ServiceCredential)