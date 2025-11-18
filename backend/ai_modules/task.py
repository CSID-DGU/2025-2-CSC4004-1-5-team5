import requests
import os
from django.conf import settings
from celery import shared_task
from .models import AudioChunk

@shared_task
def process_audio_chunk(chunk_id):
    print("[TASK] process_audio_chunk called → chunk_id =", chunk_id)

    chunk = AudioChunk.objects.get(id=chunk_id)

    file_path = chunk.file_path

    if not os.path.exists(file_path):
        print("[ERROR] File not found:", file_path)
        return None

    print("[TASK] Sending audio to COLAB server:", settings.COLAB_SERVER_URL)

    url = f"{settings.COLAB_SERVER_URL}/enhance_stt"
    print("[TASK] → POST", url)

    with open(file_path, "rb") as f:
        files = {"audio": f}

        try:
            response = requests.post(url, files=files, timeout=300)
        except Exception as e:
            print("[ERROR] Colab request failed:", e)
            return None

    if response.status_code != 200:
        print("[ERROR] Colab returned", response.status_code)
        print(response.text)
        return None

    data = response.json()

    print("[TASK] Colab STT result →", data)

    # STT 결과 저장
    chunk.transcript = data.get("text", "")
    chunk.confidence = data.get("confidence", 0)
    chunk.save()

    print("[TASK] 저장 완료. chunk_id =", chunk_id)

    return {
        "chunk_id": chunk_id,
        "text": chunk.transcript,
        "confidence": chunk.confidence
    }
