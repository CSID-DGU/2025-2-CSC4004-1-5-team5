from rest_framework.routers import DefaultRouter
#from .views import KeywordViewSet

router = DefaultRouter()
#router.register(r'keywords', KeywordViewSet, basename='keywords')

urlpatterns = router.urls
