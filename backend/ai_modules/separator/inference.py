# ai_modules/separator/inference.py

import os
import torch
from asteroid.models import BaseModel


SAMPLE_RATE = 16000


# ----------------------------------------------------------
# 모델 파일 경로 자동 감지
# ----------------------------------------------------------
def get_model_path():
    # Docker 환경
    docker_path = "/app/ai_models/ai.pth"
    if os.path.exists(docker_path):
        return docker_path

    # 로컬 개발 환경
    local_path = os.path.join(
        os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
        "ai_models",
        "ai.pth",
    )
    return local_path


MODEL_PATH = get_model_path()


# ----------------------------------------------------------
# 모델 로더 (strict=False 로 불일치 허용)
# ----------------------------------------------------------
def load_custom_model(device="cpu"):
    print("[INFO] Separator 모델 로드 중...")
    print("[INFO] checkpoint:", MODEL_PATH)

    # 1) Asteroid 기본 모델 구조 로드
    model = BaseModel.from_pretrained("JorisCos/DCCRNet_Libri1Mix_enhsingle_16k")

    # 2) state_dict 로드
    state = torch.load(MODEL_PATH, map_location=device)

    # 3) 불일치 허용 로딩
    model.load_state_dict(state, strict=False)

    model.to(device)
    model.eval()

    print("[INFO] Separator 모델 로딩 완료")
    return model


# ----------------------------------------------------------
# Inference 함수
# ----------------------------------------------------------
def run_model(model, wav_tensor, device="cpu"):
    wav = wav_tensor.to(device)

    # [T] → [1, T]
    if wav.dim() == 1:
        wav = wav.unsqueeze(0)

    # [1, T] → [1, 1, T]
    if wav.dim() == 2:
        wav = wav.unsqueeze(1)

    with torch.no_grad():
        out = model(wav)

    # 출력 정리
    if isinstance(out, (list, tuple)):
        out = out[0]

    if out.dim() == 3:
        out = out[0]
    if out.dim() == 2:
        out = out[0]

    return out.cpu()
