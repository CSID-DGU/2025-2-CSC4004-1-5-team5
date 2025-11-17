from django.urls import path
from rest_framework.routers import DefaultRouter
from .views import (
    SessionViewSet,
    AudioChunkViewSet,
    SessionStatusViewSet,
    SessionResultViewSet
)

app_name = "recordings"

router = DefaultRouter()

router.register(r"session", SessionViewSet, basename="session")
router.register(r"audio", AudioChunkViewSet, basename="audio")
router.register(r"session-status", SessionStatusViewSet, basename="session-status")
router.register(r"results", SessionResultViewSet, basename="session-results")

urlpatterns = router.urls
