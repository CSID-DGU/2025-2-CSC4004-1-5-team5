from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import *

#router = DefaultRouter()
#router.register(r'', UserViewSet, basename='users')

urlpatterns = [
    #path('', include(router.urls)),
]