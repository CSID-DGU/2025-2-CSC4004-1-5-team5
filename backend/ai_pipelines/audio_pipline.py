"""
Celery task 예시
: 10초 단위 오디오 처리 → 안내방송 필터링(pth) → STT → Broadcast 저장 → Keyword 감지 → Transcript 생성
"""

from celery import shared_task
from recordings.models import AudioChunk, Broadcast, Session, Transcript
from keywords.models import Keyword, Alert

@shared_task
def process_audio_chunk(chunk_id):
    """오디오 청크 처리 (pth + Whisper + 키워드 감지)"""
    chunk = AudioChunk.objects.get(id=chunk_id)
    session = chunk.session

    # 1️⃣ pth 모델로 안내방송만 분리
    # separated_audio = run_pth_model(chunk.file_path)

    # 2️⃣ Whisper로 텍스트 변환
    # text, confidence = run_whisper(separated_audio)
    text, confidence = "이번 역은 신도림역입니다. 내리실 문은 오른쪽입니다.", 0.92

    # 3️⃣ Broadcast 생성
    broadcast = Broadcast.objects.create(
        session=session,
        audio_chunk=chunk,
        full_text=text,
        confidence_avg=confidence
    )

    # 4️⃣ 키워드 감지
    for keyword in Keyword.objects.filter(session=session):
        if keyword.word in text:
            broadcast.keywords_detected.add(keyword)
            Alert.objects.create(keyword=keyword, broadcast=broadcast)

    # 5️⃣ 진행률 갱신
    total = session.chunks.count()
    done = session.broadcasts.count()
    session.progress = round((done / total) * 100, 1)
    session.save()


@shared_task
def generate_transcript_summary(session_id):
    """세션 전체 요약 (모든 Broadcast 기반 LLM Summarizer)"""
    session = Session.objects.get(id=session_id)
    broadcasts = session.broadcasts.all()

    combined_text = " ".join(b.full_text for b in broadcasts)
    # summary = run_llm_summarizer(combined_text)
    summary = "2호선 신도림역 도착 및 환승, 지연 안내 포함"

    total_broadcasts = broadcasts.count()
    total_keywords = sum(b.keywords_detected.count() for b in broadcasts)
    avg_conf = broadcasts.aggregate(models.Avg("confidence_avg"))["confidence_avg__avg"] or 0

    Transcript.objects.update_or_create(
        session=session,
        defaults={
            "summary": summary,
            "total_broadcasts": total_broadcasts,
            "total_keywords": total_keywords,
            "accuracy_avg": avg_conf,
        },
    )

    session.status = "COMPLETE"
    session.save()
