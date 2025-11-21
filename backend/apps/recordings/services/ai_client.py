import requests
from django.conf import settings

AI_URL = settings.AI_SERVER_URL  # .env 에서 관리

def call_ai_server(audio_path):
    with open(audio_path, "rb") as f:
        response = requests.post(AI_URL, files={"audio": f}, timeout=30)

    response.raise_for_status()
    return response.json()
