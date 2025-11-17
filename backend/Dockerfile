FROM python:3.12-slim

WORKDIR /app

# 1) 시스템 패키지 설치
RUN apt-get update && apt-get install -y \
    ffmpeg \
    libsndfile1 \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# 2) pip 업그레이드
RUN pip install --upgrade pip

# 3) torch/torchaudio 먼저 설치 (CPU)
RUN pip install torch==2.9.1 torchaudio==2.9.1 --index-url https://download.pytorch.org/whl/cpu

# 4) requirements만 먼저 추가 → 캐시 적용됨
COPY requirements.txt .

RUN pip install -r requirements.txt

# 5) 마지막에 전체 코드 COPY
COPY . .

CMD ["gunicorn", "project.wsgi:application", "--bind", "0.0.0.0:8000"]
