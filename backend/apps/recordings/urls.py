from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    SessionViewSet,
    AudioChunkViewSet,
)
from .sse.stream import session_event_stream

app_name = "recordings"

router = DefaultRouter()
router.register(r"session", SessionViewSet, basename="session")
router.register(r"audio", AudioChunkViewSet, basename="audio")

urlpatterns = [
    # 기본 REST 라우터
    path("", include(router.urls)),
]
