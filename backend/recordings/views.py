from django.shortcuts import render
from rest_framework import viewsets, status
from rest_framework.response import Response
from django.shortcuts import get_object_or_404

from .models import Session, AudioChunk, Transcript
from .serializers import SessionSerializer, AudioUploadSerializer, ResultSerializer


from django.shortcuts import get_object_or_404

from .task import process_audio_chunk

import torchaudio


from django.core.files.storage import FileSystemStorage

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
        
################################################################################
# AudioChunk 업로드 및 처리 시작    
class AudioChunkViewSet(viewsets.ViewSet):
    def create(self, request):
        serializer = AudioUploadSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        session = serializer.validated_data["session"]
        audio_file = serializer.validated_data["audio_file"]

        # -----------------------------
        # 파일 저장
        # -----------------------------
        fs = FileSystemStorage(location="media/audio/")  # 실제 저장 폴더
        saved_name = fs.save(audio_file.name, audio_file)
        saved_path = fs.path(saved_name)  # 절대 경로 반환됨

        # -----------------------------
        # AudioChunk DB 생성
        # -----------------------------
        chunk = AudioChunk.objects.create(
            session=session,
            file_path=saved_path,   # 절대경로 저장
            status="PENDING",
        )

        # Celery 비동기 실행
        process_audio_chunk.delay(chunk.id)

        return Response(
            {
                "audio_id": chunk.id,
                "status": "PROCESSING",
                "file": saved_name,
            },
            status=201,
        )

################################################################################
# 세션 상태 및 결과 조회
class SessionStatusViewSet(viewsets.ViewSet):
    """
    [GET] /api/session/{id}/status/
    """

def retrieve(self, request, pk=None):
    session = get_object_or_404(Session, id=pk)

    if session.is_expired:
        session.delete()
        return Response(
            {"detail": "Session이 만료되었습니다."},
            status=status.HTTP_410_GONE
        )

    from keywords.models import Alert  # avoid circular import
    alerts = Alert.objects.filter(keyword__session=session)

    data = {
        "session_id": str(session.id),
        "status": session.status,
        "progress": session.progress,
        "total_broadcasts": session.broadcast_set.count(),
        "total_keywords": alerts.count(),
        "keyword_alerts": [
            {
                "broadcast_id": a.broadcast.id,
                "keyword": a.keyword.word,
                "detected_at": a.detected_at,
            }
            for a in alerts
        ],
    }

    return Response(data)


class SessionResultViewSet(viewsets.ViewSet):
    """
    [GET] /api/session/{id}/results/
    """

    def retrieve(self, request, pk=None):
        session = get_object_or_404(Session, id=pk)

        serializer = ResultSerializer(session)
        return Response(serializer.data)

