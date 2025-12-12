from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views.session import SessionViewSet
from .views.audio_chunk import AudioChunkViewSet
from .views.audio_save import SaveCleanAudio

app_name = "recordings"

router = DefaultRouter()
router.register(r"session", SessionViewSet, basename="session")
router.register(r"audio", AudioChunkViewSet, basename="audio")

urlpatterns = [
    # 기본 REST 라우터
    path("", include(router.urls)),
    path("save-clean-audio/", SaveCleanAudio.as_view()),
]
