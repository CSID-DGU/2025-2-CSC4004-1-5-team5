# 1. Python 기반 이미지
FROM python:3.10-slim

# 2. 작업 디렉토리 설정
WORKDIR /app

# 3. 종속성 복사 및 설치
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# 4. 소스 복사
COPY . .

# 5. 환경 변수
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

# 6. Gunicorn으로 실행
CMD ["gunicorn", "project.wsgi:application", "--bind", "0.0.0.0:8000"]
