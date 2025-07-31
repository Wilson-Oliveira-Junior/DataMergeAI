from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r'chat', views.ChatMessageViewSet)
router.register(r'versions', views.VersionViewSet)

urlpatterns = [
    path('', include(router.urls)),
    path('upload/', views.ExcelFileUploadView.as_view(), name='excel-upload'),
    path('export-email/', views.exportar_enviar_email, name='export-email'),
]