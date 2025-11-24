from .llm import is_continuation
from .nlp import guess_station_name

ENDING_PATTERNS = ("입니다", "입니다.", "다.", "요.", "요")

def is_sentence_incomplete(text: str) -> bool:
    t = text.strip()
    return not t.endswith(ENDING_PATTERNS)


def is_broadcast_keyword(text: str) -> bool:
    # 안내방송 고유 키워드
    keywords = [
        "환승", "이번 역", "도착", "지연", 
        "열차", "내리실 문", "출입문", "승객", 
        "방면", "도착하겠습니다"
    ]
    return any(k in text for k in keywords)


def is_time_close(prev, curr) -> bool:
    """
    연속 방송은 보통 5~7초 간격.
    너무 길면 새로운 방송.
    """
    return (curr.created_at - prev.created_at).total_seconds() <= 12


def is_intro_broadcast(text: str) -> bool:
    """
    '이번 역은 ___역입니다.' 패턴 탐지
    안내방송의 시작 문장일 가능성이 매우 높다.
    """
    return "이번 역은" in text or "이번역은" in text


def group_broadcasts(broadcasts):
    if not broadcasts:
        return []

    groups = []
    cur_group = [broadcasts[0]]

    for i in range(1, len(broadcasts)):
        prev = cur_group[-1]
        curr = broadcasts[i]

        prev_text = prev.full_text
        curr_text = curr.full_text

        # ------------------------------
        # 0) 역명 기반 비교
        # ------------------------------
        prev_station = guess_station_name(prev_text)
        curr_station = guess_station_name(curr_text)

        if prev_station and curr_station:
            if prev_station == curr_station:
                cur_group.append(curr)
                continue


        # ------------------------------
        # 1) '이번 역은'이 등장하면 새로운 방송 시작으로 간주
        # 단, 바로 전 방송과 역명이 같으면 계속 이어짐
        # ------------------------------
        if is_intro_broadcast(curr_text):

            # 역명이 동일하면 이어지는 경우가 꽤 많음
            if prev_station and curr_station and prev_station == curr_station:
                cur_group.append(curr)
                continue

            # 아니면 새로운 방송 시작으로 처리
            groups.append(cur_group)
            cur_group = [curr]
            continue


        # ------------------------------
        # 2) 시간 간격 판단 
        # ------------------------------
        if is_time_close(prev, curr):
            cur_group.append(curr)
            continue


        # ------------------------------
        # 3) 문장 끝이 불완전하면 이어짐
        # ------------------------------
        if is_sentence_incomplete(prev_text):
            cur_group.append(curr)
            continue


        # ------------------------------
        # 4) 안내방송 키워드 기반 판단
        # 두 문장 모두 안내방송적이면 이어질 가능성 높음
        # ------------------------------
        if is_broadcast_keyword(prev_text) and is_broadcast_keyword(curr_text):
            cur_group.append(curr)
            continue


        # ------------------------------
        # 5) 마지막 수단 - LLM 문맥 판단
        # ------------------------------
        try:
            if is_continuation(prev_text, curr_text):
                cur_group.append(curr)
                continue
        except:
            pass

        # ------------------------------
        # 새 그룹 생성
        # ------------------------------
        groups.append(cur_group)
        cur_group = [curr]

    if cur_group:
        groups.append(cur_group)

    return groups
