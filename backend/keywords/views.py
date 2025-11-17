from rest_framework import viewsets, status
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from .models import Keyword
from .serializers import KeywordSerializer
from recordings.models import Session

# Create your views here.
from rest_framework import viewsets, status
from rest_framework.response import Response
from django.shortcuts import get_object_or_404

from .models import Keyword
from .serializers import KeywordCreateSerializer, KeywordListSerializer
from recordings.models import Session


class KeywordViewSet(viewsets.ViewSet):
    """
    [POST] /api/keywords/ → 키워드 등록
    [GET]  /api/keywords/{session_id}/ → 키워드 조회
    """

    def create(self, request):
        serializer = KeywordCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        keywords = serializer.save()

        return Response(
            KeywordListSerializer(keywords, many=True).data,
            status=status.HTTP_201_CREATED
        )

    def retrieve(self, request, pk=None):
        session_id = pk
        session = get_object_or_404(Session, id=session_id)

        keywords = Keyword.objects.filter(session=session)
        return Response({
            "session_id": session_id,
            "keywords": [k.word for k in keywords],
        })
