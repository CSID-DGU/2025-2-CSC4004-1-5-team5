import re
from apps.keywords.models import Keyword, Alert
from apps.recordings.sse.publisher import push_event


def normalize(text: str) -> str:
    """
    한국어 키워드 감지 보정용 기본 normalization.
    - 소문자 변환
    - 특수문자 제거
    - 중복 공백 제거
    """
    text = text.lower()
    text = re.sub(r"[^ㄱ-ㅎ가-힣a-z0-9\s]", " ", text)
    text = re.sub(r"\s+", " ", text)
    return text.strip()


def detect_keywords_in_chunk(session, text,broadcast):
    """
    - 청크의 텍스트에서 키워드 감지
    - Broadcast.keywords_detected 에 저장
    - Alert 생성
    - SSE 푸시
    """
    norm = normalize(text)
    detected_keywords = []

    for kw in Keyword.objects.filter(session=session):
        if normalize(kw.word) in norm:
            
            # Broadcast <-> Keyword 연결
            broadcast.keywords_detected.add(kw)
            
            # Alert 생성
            alert = Alert.objects.create(
                session=session,
                broadcast=broadcast,
                keyword=kw    
            )
            
            # Keyword 객체만 추가
            detected_keywords.append(kw)
            
            # SSE 전송
            push_event(session.id, {
                "type": "keyword_alert",
                "keyword": kw.word,
                "broadcast_id": broadcast.id,
                "detected_at": str(alert.detected_at)
            })

    return detected_keywords