from rest_framework.views import APIView
from rest_framework.response import Response
from django.core.files.storage import FileSystemStorage
from apps.recordings.models import AudioChunk

class SaveCleanAudio(APIView):
    def post(self, request):
        file = request.FILES.get("file")
        chunk_id = request.data.get("chunk_id")

        if not file or not chunk_id:
            return Response({"error": "file and chunk_id required"}, status=400)

        chunk = AudioChunk.objects.get(id=chunk_id)

        fs = FileSystemStorage(location="media/clean/")
        filename = fs.save(file.name, file)
        saved_path = fs.path(filename)

        # 저장된 파일 경로 DB에 저장
        chunk.cleaned_path = saved_path
        chunk.save()

        return Response({
            "message": "saved",
            "clean_audio_path": saved_path
        })
