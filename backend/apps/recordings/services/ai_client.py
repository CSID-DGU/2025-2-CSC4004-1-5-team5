import requests
from django.conf import settings

AI_URL = settings.AI_SERVER_URL  # .env 에서 관리

def call_ai_server(audio_path,chunk_id):
    with open(audio_path, "rb") as f:
        response = requests.post(
            AI_URL, 
            files={"audio": f}, 
            data={"chunk_id": chunk_id},
            timeout=30
            )
        
    # 상태 코드가 400~500이어도 일단 body를 읽자
    try:
        return response.json()
    except Exception:
        return {"error": "invalid JSON", "raw": response.text}
