from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.shortcuts import get_object_or_404

from apps.keywords.models import Keyword
from apps.keywords.serializers.keyword import KeywordCreateSerializer, KeywordListSerializer
from apps.recordings.models import Session


class KeywordViewSet(viewsets.ViewSet):
    """
    [POST] /api/keywords/ → 키워드 등록
    [GET]  /api/keywords/session/{session_id}/ → 세션 키워드 조회
    """

    # POST /api/keywords/
    def create(self, request):
        serializer = KeywordCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        keywords = serializer.save()

        return Response(
            KeywordListSerializer(keywords, many=True).data,
            status=status.HTTP_201_CREATED
        )

    # GET /api/keywords/session/{session_id}/
    @action(detail=False, methods=["GET"], url_path="session/(?P<session_id>[^/.]+)")
    def by_session(self, request, session_id=None):
        session = get_object_or_404(Session, id=session_id)

        keywords = Keyword.objects.filter(session=session)

        return Response({
            "session_id": session_id,
            "keywords": [k.word for k in keywords],
        })
