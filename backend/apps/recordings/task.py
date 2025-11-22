from celery import shared_task
from django.utils import timezone
from apps.recordings.services.ai_client import call_ai_server
from apps.recordings.models import AudioChunk
from apps.broadcasts.models import Broadcast
from apps.keywords.utils.detect import detect_keywords
from apps.recordings.sse.publisher import push_event


@shared_task
def process_audio_chunk(chunk_id):
    chunk = AudioChunk.objects.get(id=chunk_id)
    session = chunk.session 

    # 1) AI 서버(STT + DCCRNet 호출)
    file_path = chunk.file_path
    result = call_ai_server(file_path,chunk_id)

    text = result.get("text", "")
    confidence = result.get("confidence", 0)
    is_broadcast = (text.strip() != "")

    # 2) 무음 / 안내방송 아님
    if not is_broadcast:
        chunk.status = "COMPLETE"
        chunk.save()

        # 진행률 업데이트
        update_session_progress(session)

        push_event(session.id, {
            "type": "progress",
            "progress": session.progress,
        })

        return {"text": "", "is_broadcast": False}

    # 3) 안내방송 감지됨 → Broadcast 생성
    broadcast = Broadcast.objects.create(
        session=session,
        audio_chunk=chunk,
        full_text=text,
        confidence_avg=confidence,
    )

    # chunk 완료 표시
    chunk.status = "COMPLETE"
    chunk.save()

    # 4) Broadcast 생성 SSE 이벤트 push
    push_event(session.id, {
        "type": "broadcast_created",
        "broadcast_id": broadcast.id,
        "full_text": broadcast.full_text,
        "confidence": confidence,
    })

    # 5) 키워드 탐지
    detected_alerts = detect_keywords(broadcast)

    # Broadcast.keywords_detected ← Keyword 목록만 저장
    broadcast.keywords_detected.set([a.keyword for a in detected_alerts])

    # SSE push: Alert 기준 전송
    for alert in detected_alerts:
        push_event(session.id, {
            "type": "keyword_alert",
            "broadcast_id": broadcast.id,
            "keyword": alert.keyword.word,
            "detected_at": alert.detected_at.isoformat(),
        })


    # 6) 요약(summary) 로직 (추가 예정)
    # summary = summarize_text(text)
    # broadcast.summary = summary
    # broadcast.save()

    # 7) 진행률 업데이트
    update_session_progress(session)

    push_event(session.id, {
        "type": "progress",
        "progress": session.progress,
    })

    return {
        "text": text,
        "is_broadcast": True
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
