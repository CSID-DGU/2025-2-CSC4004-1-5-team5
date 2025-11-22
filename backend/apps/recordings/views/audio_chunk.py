from rest_framework import viewsets
from rest_framework.response import Response
from django.core.files.storage import FileSystemStorage

from apps.recordings.models import AudioChunk
from apps.recordings.serializers.serializers import AudioUploadSerializer
from apps.recordings.task import process_audio_chunk


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

        fs = FileSystemStorage(location="media/audio/")
        saved_name = fs.save(audio_file.name, audio_file)
        saved_path = fs.path(saved_name)

        chunk = AudioChunk.objects.create(
            session=session,
            file_path=saved_path,
            status="PENDING",
        )

        process_audio_chunk.delay(chunk.id)

        return Response({
            "audio_id": chunk.id,
            "status": "PROCESSING",
            "file": saved_name,
        }, status=201)
