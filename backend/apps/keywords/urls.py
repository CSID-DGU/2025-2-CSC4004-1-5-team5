from rest_framework.routers import DefaultRouter
from apps.keywords.views.keyword import KeywordViewSet

app_name = "keywords"

router = DefaultRouter()
router.register(r"keywords", KeywordViewSet, basename="keywords")

urlpatterns = router.urls
