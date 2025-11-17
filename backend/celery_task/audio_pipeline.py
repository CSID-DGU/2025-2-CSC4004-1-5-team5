# celery_task/audio_pipeline.py

import sys
from celery import shared_task
from django.utils import timezone
import torch

from ai_modules.separator.inference import load_custom_model, run_model
from ai_modules.utils.audio import load_wav_tensor
from ai_modules.stt.whisper_stt import run_stt

from recordings.models import Session, AudioChunk, Broadcast
from keywords.models import Keyword, Alert


# ----------------------------------------------------------
# 🔒 Django 관리 명령 실행 중(migrate 등)에는 모델 로드 금지
# ----------------------------------------------------------

if (
    "migrate" in sys.argv
    or "makemigrations" in sys.argv
    or "collectstatic" in sys.argv
    or "check" in sys.argv
    or "shell" in sys.argv
):
    print("[INFO] Django 초기화 단계 → separator 모델 로드 생략")
    separator_model = None
else:
    print("[INFO] Separator 모델 로드 중...")
    separator_model = load_custom_model()
    print("[INFO] Separator 모델 로딩 완료")


# ----------------------------------------------------------
# 🧠 Celery Task: Chunk 처리
# ----------------------------------------------------------

@shared_task
def process_audio_chunk(chunk_id):
    try:
        chunk = AudioChunk.objects.get(id=chunk_id)
        session = chunk.session
        chunk.status = "PROCESSING"
        chunk.save()

        # 1. 원본 오디오 로드
        wav_tensor, sr = load_wav_tensor(chunk.file_path)

        # 2. 안내방송 분리 (모델이 존재하는 경우에만)
        if separator_model:
            try:
                clean_tensor = run_model(separator_model, wav_tensor, DEVICE)
            except Exception as e:
                print("[WARN] separator inference 실패 → 원본 오디오 사용:", e)
                clean_tensor = wav_tensor
        else:
            clean_tensor = wav_tensor

        # 3. Whisper STT
        text, confidence = run_stt(clean_tensor)

        # 4. Broadcast 생성
        broadcast = Broadcast.objects.create(
            session=session,
            audio_chunk=chunk,
            full_text=text,
            confidence_avg=confidence,
        )

        # 5. 키워드 감지
        keywords = Keyword.objects.filter(session=session)
        for kw in keywords:
            if kw.word in text:
                broadcast.keywords_detected.add(kw)
                Alert.objects.create(keyword=kw, broadcast=broadcast)

        # 6. 세션 progress 증가
        session.progress = min(session.progress + 10, 100)
        session.save()

        # 7. Chunk 완료
        chunk.status = "COMPLETE"
        chunk.save()

    except Exception as e:
        chunk = AudioChunk.objects.get(id=chunk_id)
        chunk.status = "ERROR"
        chunk.save()
        print(f"[ERROR] chunk {chunk_id} 처리 실패:", e)
