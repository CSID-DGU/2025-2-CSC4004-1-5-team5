from rest_framework.routers import DefaultRouter
from .views import SessionViewSet

app_name = "recordings"

router = DefaultRouter()
router.register(r'sessions', SessionViewSet, basename='sessions')

# 추후 확장용
# router.register(r'audio', AudioViewSet, basename='audio')
# router.register(r'results', ResultViewSet, basename='results')

urlpatterns = router.urls
