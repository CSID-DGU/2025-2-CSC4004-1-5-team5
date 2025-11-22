from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.shortcuts import get_object_or_404

from apps.keywords.models import Keyword
from apps.keywords.serializers.keyword import KeywordCreateSerializer, KeywordListSerializer
from apps.recordings.models import Session


class KeywordViewSet(viewsets.ViewSet):
    """
    Keyword API
    POST   /api/keywords/                 → 키워드 등록
    GET    /api/keywords/?session_id=3    → 특정 세션의 키워드 목록
    GET    /api/keywords/session/{id}/    → (위와 동일하지만 유지)
    DELETE /api/keywords/{id}/            → 키워드 삭제
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

    # GET /api/keywords/
    # 세션 ID를 query param 으로 받는 정식 list API
    def list(self, request):
        session_id = request.query_params.get("session_id")

        if not session_id:
            return Response({"detail": "session_id query param required"}, status=400)

        session = get_object_or_404(Session, id=session_id)

        keywords = Keyword.objects.filter(session=session)
        return Response(KeywordListSerializer(keywords, many=True).data)

    # GET /api/keywords/session/{session_id}/
    @action(detail=False, methods=["GET"], url_path="session/(?P<session_id>[^/.]+)")
    def by_session(self, request, session_id=None):
        session = get_object_or_404(Session, id=session_id)
        keywords = Keyword.objects.filter(session=session)

        return Response({
            "session_id": session_id,
            "keywords": [k.word for k in keywords],
        })

    # DELETE /api/keywords/{id}/
    def destroy(self, request, pk=None):
        keyword = get_object_or_404(Keyword, id=pk)
        
        response_data = {
            "id": keyword.id,
            "keyword": keyword.word,   # ← 여기!!
            "detail": "deleted"
        }
        
        keyword.delete()
        return Response(response_data, status=status.HTTP_200_OK)

