from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import ChatSessionViewSet, GovernanceLogViewSet, AgentMemoryViewSet

router = DefaultRouter()
router.register(r'sessions', ChatSessionViewSet, basename='chat-session')
router.register(r'governance', GovernanceLogViewSet, basename='governance-log')
router.register(r'memory', AgentMemoryViewSet, basename='agent-memory')

urlpatterns = [
    path('', include(router.urls)),
]