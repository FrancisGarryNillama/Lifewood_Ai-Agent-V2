from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import ReceiptViewSet, AnalyticsViewSet, ExportLogViewSet

router = DefaultRouter()
router.register(r'receipts', ReceiptViewSet, basename='receipt')
router.register(r'analytics', AnalyticsViewSet, basename='analytics')
router.register(r'exports', ExportLogViewSet, basename='export')

urlpatterns = [
    path('', include(router.urls)),
]