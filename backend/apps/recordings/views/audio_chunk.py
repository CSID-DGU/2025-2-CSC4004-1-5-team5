from rest_framework import viewsets
from rest_framework.response import Response
from django.core.files.storage import FileSystemStorage

from apps.recordings.models import AudioChunk
from apps.recordings.serializers.serializers import AudioUploadSerializer
from apps.recordings.tasks import process_audio_chunk
from apps.recordings.sse.publisher import push_event

# ========================================================
# AudioChunk 업로드 ViewSet
# ========================================================
class AudioChunkViewSet(viewsets.ViewSet):

    # [POST] /api/audio/
    def create(self, request):
        serializer = AudioUploadSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        session = serializer.validated_data["session"]
        audio_file = serializer.validated_data["audio_file"]
        
        # ① 세션 상태를 RECORDING으로 강제 설정
        if session.status != "RECORDING":
            session.status = "RECORDING"
            session.save()

            # SSE로 상태 변경 알림 (선택)
            push_event(session.id, {
                "type": "status",
                "status": session.status
            })
        
        # ② 오디오 파일 저장
        fs = FileSystemStorage(location="media/audio/")
        saved_name = fs.save(audio_file.name, audio_file)
        saved_path = fs.path(saved_name)

        # ③ AudioChunk 레코드 생성
        chunk = AudioChunk.objects.create(
            session=session,
            file_path=saved_path,
            status="PENDING",
        )

        # ④ 비동기 처리 태스크 호출
        process_audio_chunk.delay(chunk.id)
        
        #⑤ SSE로 "새 chunk 들어옴" 알림
        push_event(session.id, {
            "type": "chunk_received",
            "chunk_id": chunk.id,
            "file": saved_name
        })

        return Response({
            "audio_id": chunk.id,
            "status": "PROCESSING",
            "file": saved_name,
        }, status=201)
