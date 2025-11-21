# Python 기반 Slim 이미지 사용 (가장 가벼움)
FROM python:3.10-slim

ENV DEBIAN_FRONTEND=noninteractive

WORKDIR /app

# 시스템 필수 패키지 최소만 설치
RUN apt-get update && apt-get install -y \
    gcc \
    && rm -rf /var/lib/apt/lists/*

# pip 업그레이드
RUN pip install --upgrade pip

# requirements.txt 복사 및 설치
COPY requirements.txt .

RUN pip install --no-cache-dir -r requirements.txt

# 프로젝트 전체 복사
COPY . .

# Gunicorn 실행
CMD ["gunicorn", "project.wsgi:application", "--bind", "0.0.0.0:8000"]
