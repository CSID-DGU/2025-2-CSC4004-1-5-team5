import os
import difflib
from openai import OpenAI
from .station_name import STATION_NAMES

client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))


# -------------------------------------------------------
# 1) 역명 후보 찾기 (부분 일치 + 오타 교정)
# -------------------------------------------------------
def guess_station_name(text: str):
    """
    STT에서 나올 수 있는 역 발음 오타를 기반으로
    가장 유사한 역명을 찾아냄.
    """

    # 전처리
    t = text.replace(" ", "").replace("역", "")

    # 1) 부분 매칭
    candidates = [s for s in STATION_NAMES if t in s.replace(" ", "")]
    if candidates:
        return candidates[0]

    # 2) difflib 기반 유사도 매칭 (0.6 이상만)
    scored = difflib.get_close_matches(t, STATION_NAMES, n=1, cutoff=0.6)
    return scored[0] if scored else None


# -------------------------------------------------------
# 2) STT 문장 보정 + 역명 반영 버전
# -------------------------------------------------------
def correct_transcription_v2(raw_text: str) -> str:
    """
    STT 결과를 기반으로:
    - 역명 유사 매칭
    - 문장 보정
    - 안내방송 스타일 재구성
    """

    # 역명 후보 찾기
    station = guess_station_name(raw_text)

    station_part = f"추정 역명 후보: {station}" if station else "추정 역명 없음"

    prompt = f"""
당신은 한국 지하철 안내방송을 복원하는 전문가입니다.

아래 텍스트는 STT로 받아온 것으로,
문장 중간 끊김 / 오타 / 단어 잘림이 존재합니다.

당신은 다음을 수행해야 합니다:

1) 끊긴 문장을 자연스럽게 복원하기
2) 지하철 안내방송 스타일로 문장을 재구성하기
3) 역명은 아래의 후보가 맞으면 반영하고, 애매하면 가장 자연스러운 실제 역명으로 보정하기
4) 문장 패턴을 꼭 유지하기:
    - "이번 역은 ___역입니다."
    - "내리실 문은 ___쪽입니다."
    - "환승하실 승객께서는 ___로 이동하시기 바랍니다."
5) 절대 엉뚱한 역명은 생성하지 말기
6) 출력은 **최종 재구성된 방송 문장만**

===========================
[STT 원문]
{raw_text}

[{station_part}]
===========================

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
