from rest_framework.routers import DefaultRouter
from .views import SessionViewSet

router = DefaultRouter()
router.register(r'session', SessionViewSet, basename='session')
#router.register(r'audio', AudioViewSet, basename='audio')
#router.register(r'results', ResultViewSet, basename='results')

urlpatterns = router.urls
