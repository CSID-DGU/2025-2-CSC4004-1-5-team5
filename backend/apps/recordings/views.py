from rest_framework.decorators import action
from rest_framework import viewsets, status
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from django.http import StreamingHttpResponse
from django.core.files.storage import FileSystemStorage

from apps.keywords.models import Alert
from .sse.stream import event_stream
from .models import Session, AudioChunk
from .serializers import SessionSerializer, AudioUploadSerializer, ResultSerializer
from .task import process_audio_chunk


# ========================================================
# Session ViewSet — CRUD + status + results + SSE
# ========================================================
class SessionViewSet(viewsets.ViewSet):

    # [POST] /api/session/
    def create(self, request):
        session = Session.objects.create()
        return Response(SessionSerializer(session).data, status=status.HTTP_201_CREATED)

    # [GET] /api/session/{id}/
    def retrieve(self, request, pk=None):
        session = get_object_or_404(Session, id=pk)

        if session.is_expired:
            session.delete()
            return Response(
                {"detail": "Session이 만료되었습니다."},
                status=status.HTTP_410_GONE
            )

        return Response(SessionSerializer(session).data)

    # [DELETE] /api/session/{id}/
    def destroy(self, request, pk=None):
        session = get_object_or_404(Session, id=pk)
        session.delete()
        return Response({"detail": f"Session {pk} deleted."})


    # -----------------------------
    # [GET] /api/session/{id}/status/
    # -----------------------------
    @action(detail=True, methods=["GET"], url_path="status")
    def status(self, request, pk=None):
        session = get_object_or_404(Session, id=pk)

        # expired 처리 일관성 유지
        if session.is_expired:
            session.delete()
            return Response(
                {"detail": "Session이 만료되었습니다."},
                status=status.HTTP_410_GONE
            )

        alerts = Alert.objects.filter(keyword__session=session)

        data = {
            "session_id": pk,
            "status": session.status,
            "progress": session.progress,
            "total_broadcasts": session.broadcasts.count(),
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


    # -----------------------------
    # [GET] /api/session/{id}/results/
    # -----------------------------
    @action(detail=True, methods=["GET"], url_path="results")
    def results(self, request, pk=None):
        session = get_object_or_404(Session, id=pk)
        return Response(ResultSerializer(session).data)


    # -----------------------------
    # [GET] /api/session/{id}/stream/
    # -----------------------------
    @action(detail=True, methods=["GET"], url_path="stream")
    def stream(self, request, pk=None):
        response = StreamingHttpResponse(
            event_stream(pk),
            content_type="text/event-stream"
        )
        response["X-Accel-Buffering"] = "no"
        return response



# ========================================================
# AudioChunk 업로드 ViewSet
# ========================================================
class AudioChunkViewSet(viewsets.ViewSet):

    def create(self, request):
        serializer = AudioUploadSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        session = serializer.validated_data["session"]
        audio_file = serializer.validated_data["audio_file"]

        fs = FileSystemStorage(location="media/audio/")
        saved_name = fs.save(audio_file.name, audio_file)
        saved_path = fs.path(saved_name)

        chunk = AudioChunk.objects.create(
            session=session,
            file_path=saved_path,
            status="PENDING",
        )

        process_audio_chunk.delay(chunk.id)

        return Response(
            {
                "audio_id": chunk.id,
                "status": "PROCESSING",
                "file": saved_name,
            },
            status=201,
        )
