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


def detect_keywords_in_chunk(session, text):
    norm = normalize(text)
    detected = []

    for kw in Keyword.objects.filter(session=session):
        if normalize(kw.word) in norm:
            detected.append(kw)
            push_event(session.id, {
                "type": "keyword_alert",
                "keyword": kw.word
            })

    return detected