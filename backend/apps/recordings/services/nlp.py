import os
import hgtk
from difflib import SequenceMatcher
from openai import OpenAI
from .station_name import STATION_NAMES

client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))


# -------------------------------------------------------
# 1) 역명 후보 찾기 (부분 일치 + 오타 교정)
# -------------------------------------------------------

def jamo(text):
    try:
        return hgtk.text.decompose(text)
    except:
        return text

def jamo_similarity(a, b):
    return SequenceMatcher(None, jamo(a), jamo(b)).ratio()

def guess_station_name(text: str):
    t = text.replace(" ", "").replace("역", "")

    # 우선 부분 일치
    for name in STATION_NAMES:
        if t in name.replace(" ", ""):
            return name

    # 자모 기반 유사도
    best = None
    best_score = 0

    for name in STATION_NAMES:
        score = jamo_similarity(t, name)
        if score > best_score:
            best = name
            best_score = score

    return best if best_score > 0.55 else None



# -------------------------------------------------------
# 2) STT 문장 보정 + 역명 반영 버전
# -------------------------------------------------------
def correct_transcription_v2(raw_text: str):
    station = guess_station_name(raw_text)
    station_list = ", ".join([station]) if station else "없음"

    prompt = f"""
당신은 '지하철 안내방송 복원 전문가'입니다.

아래 STT 텍스트를 읽고 다음 규칙으로 **정확한 안내방송**을 재구성하세요:

규칙:
1) 문장 구조는 아래 3개 중 필요한 것만 사용:
    - "이번 역은 ___역입니다."
    - "내리실 문은 ___쪽입니다."
    - "환승하실 승객께서는 ___로 이동하시기 바랍니다."
2) 역명은 반드시 아래 후보 중에서만 선택:
    → [{station_list}]
3) 후보가 '없음'이면 역명을 생성하지 말고 문장에서 추출 가능한 경우만 사용.
4) 절대 존재하지 않는 역명을 만들지 말 것.
5) 잘린 문장은 자연스럽게 복원.
6) 출력은 안내방송 문장만 작성.

[STT 텍스트]
{raw_text}

[재구성된 안내방송]
"""

    res = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[{"role": "user", "content": prompt}]
    )
    return res.choices[0].message.content.strip()



# -------------------------------------------------------
# 3) 안내방송 요약 (정형 요약)
# -------------------------------------------------------
def summarize_text_v2(text: str) -> str:
    """
    지하철 안내방송 문장을 구조적으로 요약한다.
    """

    prompt = f"""
당신은 지하철 안내방송 요약 전문가입니다.

아래 문장을 읽고 다음 항목으로만 요약하세요:

1. 역 이름
2. 문 열림 방향
3. 환승 정보
4. 안전/지연/주의 안내가 있다면 1줄 추가

출력 형식 예시:
- 역: 구로역
- 문 방향: 오른쪽
- 환승: 1호선, 7호선
- 기타: 열차 지연 안내 포함

문장 외의 정보는 절대 추가하지 않습니다.

[원문]
{text}

[요약]
"""

    res = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[{"role": "user", "content": prompt}]
    )
    return res.choices[0].message.content.strip()

# -------------------------------------------------------
# 4) 안내방송에서 구조화된 정보 추출

def extract_info_v1(text: str) -> dict:
    """
    지하철 안내방송 문장에서 구조화된 정보를 추출한다.
    반환:
    {
        "station": "구로역",
        "door": "오른쪽",
        "transfers": ["1호선", "7호선"],
        "warnings": ["열차 지연 안내"]
    }
    """

    prompt = f"""
당신은 '지하철 안내방송 전문 파서(parser)'입니다.

아래 문장을 보고 다음 항목을 JSON으로 추출하세요:

필수 항목:
1. station → 역 이름 (예: "구로역")
2. door → 문 열림 방향 ("왼쪽", "오른쪽" 중 하나. 없으면 null)
3. transfers → 환승 노선 목록 (예: ["1호선", "7호선"])
4. warnings → 지연/안전/주의 관련 문장을 간단히 요약한 목록

⚠️ 규칙
- 역명을 임의로 생성하지 말고, 문장에서 추론 가능한 경우만 추출
- JSON 외의 다른 텍스트를 절대 출력하지 말 것
- null / 빈 리스트 허용

[입력 문장]
{text}

[출력 포맷]
{{
    "station": "...",
    "door": "...",
    "transfers": [...],
    "warnings": [...]
}}
"""

    res = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[{"role": "user", "content": prompt}]
    )
    content = res.choices[0].message.content.strip()

    # JSON 파싱 시도
    import json
    try:
        return json.loads(content)
    except:
        # 모델이 포맷을 100% 맞추지 못했을 때
        return {
            "station": None,
            "door": None,
            "transfers": [],
            "warnings": []
        }
