# ai_modules/stt/whisper_stt.py

import whisper
import torch

# -------------------------------------------
# Lazy Loading Whisper Model (Celery only)
# -------------------------------------------
_whisper_model = None

def get_whisper_model(model_name="large"):
    global _whisper_model

    if _whisper_model is None:
        print(f"[INFO] Whisper model '{model_name}' loading...")
        _whisper_model = whisper.load_model(model_name)
        print("[INFO] Whisper model loaded successfully.")

    return _whisper_model


# -------------------------------------------
# STT 실행 함수 - Celery worker
# -------------------------------------------
def run_stt(wav_tensor):
    """
    - wav_tensor: clean audio tensor
    - return: (text, confidence)
    """
    model = get_whisper_model()
    # Whisper는 numpy array 또는 torch tensor 허용
    if isinstance(wav_tensor, torch.Tensor):
        wav_numpy = wav_tensor.cpu().numpy()
    else:
        wav_numpy = wav_tensor

    result = model.transcribe(wav_numpy)

    text = result.get("text", "").strip()
    confidence = result.get("avg_logprob", 0)

    return text, confidence
