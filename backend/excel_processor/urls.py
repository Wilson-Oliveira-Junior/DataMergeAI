from django.urls import path, include
from rest_framework.routers import DefaultRouter

from .views import ChatMessageViewSet, VersionViewSet, ExcelFileUploadView, exportar_enviar_email
router = DefaultRouter()
router.register(r'chat', ChatMessageViewSet, basename='chat')
router.register(r'versions', VersionViewSet, basename='versions')

urlpatterns = [
    path('upload/', ExcelFileUploadView.as_view(), name='excel-upload'),
    path('exportar-email/', exportar_enviar_email, name='exportar-email'),
    path('', include(router.urls)),
]
