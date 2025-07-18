

from rest_framework import serializers
from .models import Version, ChatMessage, ExcelFile

class VersionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Version
        fields = ['id', 'name', 'data', 'user', 'timestamp']

class ChatMessageSerializer(serializers.ModelSerializer):
    class Meta:
        model = ChatMessage
        fields = ['id', 'user', 'message', 'timestamp']

class ExcelFileSerializer(serializers.ModelSerializer):
    class Meta:
        model = ExcelFile
        fields = ['id', 'file', 'uploaded_at']
