from rest_framework import viewsets, status
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from .models import Keyword
from .serializers import KeywordSerializer
from recordings.models import Session

class KeywordViewSet(viewsets.ViewSet):
    """
    [POST]   /api/keywords/       → 키워드 등록
    [GET]    /api/keywords/       → 키워드 조회
    [DELETE] /api/keywords/{id}/  → 키워드 삭제
    """

    #[POST]   /api/keywords/
    #  키워드 등록
    def create(self, request):
        session_id = request.data.get("session_id")
        keywords = request.data.get("keywords", [])

        if not session_id:
            return Response({"detail": "session_id 필요"}, status=status.HTTP_400_BAD_REQUEST)

        session = get_object_or_404(Session, session_id=session_id)
        created = []

        for word in keywords:
            obj, _ = Keyword.objects.get_or_create(session=session, word=word)
            created.append(obj)

        serializer = KeywordSerializer(created, many=True)
        return Response({"등록 키워드 ": serializer.data}, status=status.HTTP_201_CREATED)

    #[GET]    /api/keywords/
    #  세션별 키워드 조회
    def retrieve(self, request, pk=None):
        """(?session_id=1)"""
        session_id = request.query_params.get("session_id")
        if not session_id:
            return Response({"detail": "session_id 필요"}, status=status.HTTP_400_BAD_REQUEST)

        keywords = Keyword.objects.filter(session_id=session_id)
        serializer = KeywordSerializer(keywords, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    #[DELETE]  /api/keywords/{id}/
    #  특정 키워드 삭제
    def destroy(self, request, pk=None):
        keyword = get_object_or_404(Keyword, id=pk)
        session_id = keyword.session_id
        word = keyword.word
        keyword.delete()

        return Response(
            {
                "detail": f"Keyword '{word}' 삭제",
                "session_id": str(session_id),
                "keyword_id": pk,
            },
            status=status.HTTP_200_OK,
        )
