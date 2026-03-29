from django.contrib import admin

# Register your models here.
import chat.models as chat_models

admin.site.register(chat_models.Room)
admin.site.register(chat_models.Message)