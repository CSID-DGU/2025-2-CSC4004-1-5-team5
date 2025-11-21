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


def detect_keywords(broadcast):
    """
    broadcast.full_text 안에서 session 키워드 감지 후 Alert 생성.
    중복 Alert 방지 포함.
    """
    session = broadcast.session
    text = normalize(broadcast.full_text)

    detected_keywords = []

    # 세션에 등록된 키워드 전체 검색
    for keyword in Keyword.objects.filter(session=session):
        kw_normalized = normalize(keyword.word)

        # 부분 매칭 (예: "지연됩니다" 안에 "지연" 감지)
        if kw_normalized in text:

            # 중복 Alert 방지
            if not Alert.objects.filter(keyword=keyword, broadcast=broadcast).exists():
                alert = Alert.objects.create(
                    keyword=keyword,
                    broadcast=broadcast
                )
                detected_keywords.append(alert)

                # SSE push
                push_event(session.id, {
                    "type": "keyword_alert",
                    "keyword": keyword.word,
                    "broadcast_id": broadcast.id,
                    "detected_at": str(alert.detected_at),
                })

    return detected_keywords
