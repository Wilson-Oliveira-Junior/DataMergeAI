from django.db import models

# Modelo para historico de versoes
class Version(models.Model):
    name = models.CharField(max_length=100)
    data = models.TextField()  # JSON ou texto serializado
    user = models.CharField(max_length=100, blank=True, null=True)
    timestamp = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-timestamp']

    def __str__(self):
        return f"{self.name} ({self.timestamp:%Y-%m-%d %H:%M})"

# Chat para integracao frontend-backend
class ChatMessage(models.Model):
    user = models.CharField(max_length=100)
    message = models.TextField()
    timestamp = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['timestamp']

    def __str__(self):
        return f"{self.user}: {self.message[:30]}"

class ExcelFile(models.Model):
    file = models.FileField(upload_to='uploads/')
    uploaded_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"ExcelFile(id={self.id}, file={self.file.name})"