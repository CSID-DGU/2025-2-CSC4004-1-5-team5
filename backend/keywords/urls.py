from rest_framework.routers import DefaultRouter
from .views import KeywordViewSet

app_name = "keywords"
router = DefaultRouter()
router.register(r"recordings", KeywordViewSet, basename="keywords")

urlpatterns = router.urls
