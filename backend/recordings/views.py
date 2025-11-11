from django.shortcuts import render
from rest_framework import viewsets, status
from rest_framework.response import Response
from django.shortcuts import get_object_or_404

from .models import Session, AudioChunk, Transcript
from .serializers import SessionSerializer

# 세션 관리 (실시간 분석 시작 시 생성)
class SessionViewSet(viewsets.ViewSet):
    """
    [POST] /api/session/  → 새로운 세션 생성
    [GET]  /api/session/{id}/  → 세션 상태 확인
    [DELETE] /api/session/{id}/  → 세션 삭제
    """

    #[POST]  /api/session/
    # 새로운 세션 생성  
    def create(self, request):
        session = Session.objects.create()
        serializer = SessionSerializer(session)
        return Response(serializer.data, status=status.HTTP_201_CREATED)


    #[GET]  /api/session/{id}/
    # 세션 상태 확인
    def retrieve(self, request, pk=None):
        session = get_object_or_404(Session, id=pk)

        if session.is_expired:
            session.delete()
            return Response({"detail": "Session이 만료되었습니다."}, status=status.HTTP_410_GONE)

        serializer = SessionSerializer(session)
        return Response(serializer.data, status=status.HTTP_200_OK)
    
    #[DELETE] /api/session/{id}/
    # 세션 삭제
    def destroy(self, request, pk=None):
        session = get_object_or_404(Session, id=pk)
        session_id = session.id
        session.delete()

        return Response(
            {
                "detail": f"[Session: {session_id}] 삭제",
                "id": session_id,
            },
            status=status.HTTP_200_OK, 
        )