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

        session = get_object_or_404(Session, id=session_id)
        created = []

        for word in keywords:
            word = word.strip()
            obj, _ = Keyword.objects.get_or_create(session=session, word=word)
            created.append(obj)
            
        total_count = Keyword.objects.filter(session=session).count()

        serializer = KeywordSerializer(created, many=True)
        return Response({"total_keywords": total_count,  
                        "keywords": serializer.data}, status=status.HTTP_201_CREATED)

    #[GET]    /api/keywords/
    #  세션별 키워드 조회
    def list(self, request, pk=None):
        """(?session_id=1)"""
        session_id = request.query_params.get("session_id")
        if not session_id:
            return Response({"detail": "session_id 필요"}, status=status.HTTP_400_BAD_REQUEST)

        keywords = Keyword.objects.filter(session__id=session_id)
        serializer = KeywordSerializer(keywords, many=True)
        return Response(
            {
                "session_id": int(session_id),
                "total_keywords": len(serializer.data), 
                "keywords": serializer.data,
            }, status=status.HTTP_200_OK    
        )

    #[DELETE]  /api/keywords/{id}/
    #  특정 키워드 삭제
    def destroy(self, request, pk=None):
        keyword = get_object_or_404(Keyword, id=pk)
        
        session_id = keyword.session.id
        word = keyword.word
        keyword.delete()
        
        remaining_count = Keyword.objects.filter(session__id=session_id).count()

        return Response(
            {
                "detail": f"Keyword '{word}' 삭제",
                "session_id": str(session_id),
                "remaining_keywords": remaining_count,
                "keyword_id": pk,
            },
            status=status.HTTP_200_OK,
        )
