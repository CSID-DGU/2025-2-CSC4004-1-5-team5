from celery import shared_task
from django.utils import timezone
from apps.recordings.services.ai_client import call_ai_server
from apps.recordings.models import AudioChunk
from apps.broadcasts.models import Broadcast
from apps.keywords.utils.detect import detect_keywords_in_chunk
from apps.recordings.sse.publisher import push_event


@shared_task
def process_audio_chunk(chunk_id):
    chunk = AudioChunk.objects.get(id=chunk_id)
    session = chunk.session 

    result = call_ai_server(chunk.file_path, chunk_id)
    text = result.get("text", "")
    confidence = result.get("confidence", 0)

    # 무음이면 아무것도 안 함
    if text.strip() == "":
        chunk.status = "COMPLETE"
        chunk.save()
        
        # 실시간 청크 개수 이벤트 보내기
        update_session_chunk_count(session)
        return {"text": "", "is_broadcast": False}

    #chunk 단위 즉시 키워드 감지
    detected = detect_keywords_in_chunk(session, text)

    # chunk 완료 표시
    chunk.status = "COMPLETE"
    chunk.save()

    # 실시간 청크 개수 이벤트 보내기
    update_session_chunk_count(session)

    return {
        "text": text,
        "is_broadcast": True,
        "detected_keywords": [a.keyword.word for a in detected]
    }



def update_session_chunk_count(session):
    done = session.chunks.filter(status="COMPLETE").count()

    # SSE로 실시간 전달
    push_event(session.id, {
        "type": "chunk_count",
        "done": done,
    })
