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
    return response.json()
