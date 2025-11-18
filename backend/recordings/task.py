import requests
from celery import shared_task
from project import settings
from recordings.models import AudioChunk, Broadcast


@shared_task
def process_audio_chunk(chunk_id):
    print(f"[TASK] process_audio_chunk 시작 → chunk_id={chunk_id}")

    # 1) CHUNK 정보 불러오기
    chunk = AudioChunk.objects.get(id=chunk_id)
    file_path = chunk.file_path

    COLAB_URL = settings.COLAB_SERVER_URL
    endpoint = f"{COLAB_URL}/enhance_stt"

    print(f"[TASK] Colab 서버 전송 → {endpoint}")
    print(f"[TASK] 파일: {file_path}")

    # 2) Colab 서버로 파일 전송
    try:
        with open(file_path, "rb") as f:
            response = requests.post(
                endpoint,
                files={"audio": f},
                timeout=300,
            )
    except Exception as e:
        print("[ERROR] Colab 요청 실패:", e)
        chunk.status = "ERROR"
        chunk.save()
        return None

    if response.status_code != 200:
        print("[ERROR] Colab 응답 오류:", response.status_code)
        print(response.text)
        chunk.status = "ERROR"
        chunk.save()
        return None

    result = response.json()
    print("[TASK] Colab 결과:", result)

    text = result.get("text", "")
    confidence = result.get("confidence", 0)

    # ============================================================
    # 3) Broadcast 테이블에 STT 결과 저장 (정답)
    # ============================================================
    broadcast = Broadcast.objects.create(
        session=chunk.session,
        audio_chunk=chunk,
        full_text=text,
        confidence_avg=confidence,
    )

    print(f"[TASK] Broadcast 생성 완료 → broadcast_id={broadcast.id}")

    # 4) AudioChunk 상태 업데이트
    chunk.status = "COMPLETE"
    chunk.save()

    print(f"[TASK] 저장 완료 → chunk_id={chunk_id}")

    return {
        "broadcast_id": broadcast.id,
        "text": text,
        "confidence": confidence,
    }
