import os
from openai import OpenAI

client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

def correct_transcription(text: str) -> str:
    prompt = f"""
당신은 한국 지하철 안내방송을 복원하는 전문가입니다.

아래 텍스트는 10초 단위 STT 결과로,
- 문장이 중간에 끊겨 있거나
- 앞/뒤 문장이 분리되어 들어오거나
- 단어가 잘못 인식된 경우가 매우 많습니다.

🔥 당신의 목표:
아래의 조각난 문장들을 기반으로
**하나의 완전한 지하철 안내방송 문장으로 재구성**하는 것입니다.

📌 반드시 지켜야 할 규칙
1) STT 텍스트가 문장 중간에서 끊겼다면 **의미가 자연스럽도록 문장을 완성**하세요.  
    예) "이번 역은 구" → "이번 역은 구로역입니다."  
    예) "내리실 문" → "내리실 문은 오른쪽입니다."  

2) 실제 한국 지하철 방송 스타일로 복원하세요.  
    형태 예:  
    - "이번 역은 ___역입니다."  
    - "내리실 문은 ___쪽입니다."  
    - "환승하실 승객께서는 ___ 방향으로 이동하시기 바랍니다."

3) 문장이 여러 개라면 자연스러운 순서로 재배열하세요.  
4) 불명확한 단어는 가장 가능성이 높은 형태로 보정하세요.  
    - "입", "입쪽", "입은" → "이번"  
    - "오른죽", "오른쪼" → "오른쪽"  
5) 역명은 만들어내지 말고, STT에서 추론 가능한 범위에서 재구성하세요.  
6) 중복된 조각, 반복된 문장은 제거하세요.  

7) 최종 출력은 **완성된 지하철 안내방송 문장만** 출력하세요.  
    불필요한 설명문, 분석은 출력하지 않습니다.

===================
[STT 조각]
{text}
===================

[복원된 안내방송]
"""

    res = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[{"role": "user", "content": prompt}]
    )
    return res.choices[0].message.content.strip()






def summarize_text(text: str) -> str:
    prompt = f"""
당신은 한국 지하철 안내방송 요약기입니다.

출력은 반드시 아래 형식(JSON 형태)에 맞춰야 합니다.
절대로 다른 말, 설명, 문장을 추가하지 않습니다.

=== 출력 형식 (반드시 지켜야 함) ===
{{
    "station": "<역 이름 또는 '없음'>",
    "door_direction": "<왼쪽/오른쪽/없음>",
    "transfer": "<환승 정보 또는 '없음'>",
    "notice": "<안전/주의 안내 또는 '없음'>"
}}

=== 요약 규칙 ===
1) 역 이름이 없으면 station="없음"
2) 문 열림 방향이 없으면 door_direction="없음"
3) 환승 정보가 없으면 transfer="없음"
4) 안전/주의 안내 없으면 notice="없음"
5) 반드시 JSON 형식 그대로 출력

[원문]
{text}

[요약(JSON)]
"""

    res = client.chat.completions.create(
        model="gpt-4o-mini",
        response_format={"type": "json_object"},
        messages=[{"role": "user", "content": prompt}]
    )
    return res.choices[0].message.content




def is_continuation(prev: str, current: str) -> bool:
    prompt = f"""
아래 두 문장이 **같은 지하철 안내방송**의 연속인지 판단하세요.

규칙:
1) 앞 문장의 끝이 단어가 끊긴 경우 → 다음 문장이 계속 이어지는 경우 True
    예: "이번 역은 구" + "로역입니다." → 이어짐
2) 문맥상 한 안내방송으로 자연스럽게 이어지면 True
3) 서로 다른 안내 내용이면 False
4) 결과는 True 또는 False만 출력

[문장 A]
{prev}

[문장 B]
{current}

답변: 
"""

    res = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[{"role": "user", "content": prompt}]
    )

    text = res.choices[0].message.content.strip().lower()
    return "true" in text
