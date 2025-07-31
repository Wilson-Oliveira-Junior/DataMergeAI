from django.contrib import admin
from .models import Version, ChatMessage, ExcelFile

admin.site.register(Version)
admin.site.register(ChatMessage)
admin.site.register(ExcelFile)