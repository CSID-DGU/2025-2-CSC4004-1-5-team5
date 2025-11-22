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
        update_session_progress(session)
        push_event(session.id, {"type": "progress", "progress": session.progress})
        return {"text": "", "is_broadcast": False}

    #chunk 단위 즉시 키워드 감지
    detected = detect_keywords_in_chunk(session, text)

    # chunk 완료 표시
    chunk.status = "COMPLETE"
    chunk.save()

    # 진행률 SSE
    update_session_progress(session)
    push_event(session.id, {"type": "progress", "progress": session.progress})

    return {
        "text": text,
        "is_broadcast": len(detected) > 0
    }



def update_session_progress(session):
    """전체 chunk 대비 완료 chunk 비율 계산"""
    total = session.chunks.count()
    done = session.chunks.filter(status="COMPLETE").count()

    if total == 0:
        session.progress = 0
    else:
        session.progress = round((done / total) * 100, 2)

    # 100% 되면 상태도 COMPLETE로 변경
    if session.progress == 100:
        session.status = "COMPLETE"

    session.save()
