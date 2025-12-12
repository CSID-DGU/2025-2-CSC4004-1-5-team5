# 🎧 SoriBom – 실시간 지하철 안내방송 인식 서비스  
> **“소리를 시각으로, 안내방송을 누구나 쉽게”**

---

## 📖 프로젝트 개요
**SoriBom**은 지하철 안내방송을 인식하여 실시간 자막과 키워드 알림을 제공하는 서비스입니다.  
청각장애인 및 청취가 어려운 환경에서도 방송 내용을 시각적으로 확인할 수 있습니다.

---

## 🧩 주요 기능
| 구분 | 기능 설명 |
|------|------------|
| 🎙️ **실시간 STT 변환** | Whisper Large-v3 모델로 10초 단위 안내방송 실시간 변환 |
| 🔊 **잡음 제거 (DCCRNet)** | 지하철 소음 환경에서 음성 향상 및 STT 정확도 개선 |
| 🧠 **방송 요약 (LLM)** | 복원된 음성을 문맥 기반으로 요약 및 핵심 정보 추출 |
| 🏷️ **키워드 감지 및 알림** | 사용자가 등록한 단어(예: “환승”, “지연”) 포함 시 SSE 알림 발송 |
| 📡 **SSE 실시간 알림 스트림** | Django → React 프론트엔드로 실시간 이벤트 전송 |
| 📊 **결과 리포트 제공** | 방송 타임라인 / 감지 키워드 / 정확도 통계 시각화 |

---

## ⚙️ 시스템 아키텍처
<img width="2524" height="4072" alt="image" src="https://github.com/user-attachments/assets/4bdb4455-d8e5-45de-83f9-b5d8516e049e" />
> **구성 요약**
> - Frontend: Expo, Android 기반 실시간 음성 녹음 및 SSE 이벤트 수신  
> - Backend: Django + DRF + Celery + Redis  
> - AI Server: Colab GPU 환경 (Flask + Whisper + DCCRNet)  
> - Cloudflare Tunnel을 통해 EC2 ↔ Colab 간 안전한 통신 유지  

---
## 🌐 전체 데이터 흐름 요약
<img width="2876" height="4424" alt="image" src="https://github.com/user-attachments/assets/81a697e1-2593-4106-85ad-e129ca8c2a17" />


## ❤ 아키텍처의 장점
### 성능 측면

- AI 연산을 Worker로 분리해 Django API latency 최소화
- Redis 기반 비동기 구조로 대규모 동시 처리 가능
- Colab GPU 사용으로 Whisper Large 등 고성능 모델 운영 가능

### 비용 측면

- AWS GPU 사용 없이 Colab GPU 활용 → **비용 절감 극대화**
- QLoRA 기반 파인튜닝으로 학습 비용 최소화

### 확장성

- Worker 수평 확장이 가능 → STT 처리량 증가 시 대응
- 다른 AI 모델(예: TTS, Summarization) 추가 가능
- 버스·공항·관공서 방송 등 도메인 확장 가능

---
## 🧠 기술 스택
| 구분 | 기술 | 설명 |
|------|------|------|
| **Frontend** | React Native (Expo) | 실시간 음성 녹음 및 사용자 UI |
| **Backend** | Django REST Framework | 세션 / 키워드 / 결과 / SSE 관리 |
| **Async** | Celery + Redis | 비동기 오디오 분석 파이프라인 |
| **AI Server** | Flask + PyTorch | Whisper Large-v3 + DCCRNet STT 서버 |
| **Infra** | AWS EC2 (Ubuntu) + Cloudflare Tunnel | Django 서버 + Colab 연결 |
| **ML Models** | Whisper Large-v3 (Fine-tuned), DCCRNet | STT 및 잡음 제거 모델 |
| **Database** | SQLite | 세션 및 방송 결과 저장 |

---

## 🧩 AI 모델 구조
| 모델 | 설명 | 성능 개선 |
|------|------|-----------|
| **Whisper Large-v3 (Fine-tuned)** | 한국어 + 영어 이중언어 안내방송 데이터로 파인튜닝 | Word Error Rate ↓ **8.4%** |
| **DCCRNet (Noise Reduction)** | 지하철 잡음 환경에서 음질 향상 | STT 정확도 + **4%p 향상** |
| **LLM Post-processing** | STT 결과 문장 보정 및 안내방송 문맥 재구성 | 문장 완성도 ↑ |

---

## ⚡ 성능 비교

| 항목 | EC2 | CPU | GPU (Colab T4) | 향상률 |
|------|-----|-----|----------------|---------|
| 10초 음성 STT 추론 속도 | Timeout | 약 50초 | **2.1초** | **약 95.8% 단축 (≈ 24배↑)** |

---

## 📁 폴더 구조

```plaintext
ai/                          # AI 모델 백업 및 보고용 코드
├── ai_server/               # Flask 실시간 STT 서버 (Whisper + DCCRNet)
├── enhance_model/           # DCCRNet / ConvTasNet 학습 코드
└── stt_finetuning/          # Whisper Large-v3 파인튜닝 코드

backend/                     # Django + DRF 백엔드
├── recordings/              # 세션 / 청크 / Transcript 관리
├── keywords/                # 키워드 / Alert 관리
└── broadcasts/              # 안내방송 인식 결과 (Broadcast)

frontend/                    # Expo (React Native) 기반 모바일 UI

README.md                    # 프로젝트 개요 및 기술 문서


```
---

## 👥 팀 구성
| 이름 | 역할 | 주요 담당 |
|------|------|-----------|
| **하연희** | Server | Leader / API, AI 연동 설계 및 아키텍처 구축 |
| **류재훈** | Frontend | Expo 기반 UI 개발
| **정예경** | AI | DCCRNet 학습 및 음성 향상 파이프라인 구현
| **박수민** | AI | Whisper 모델 파인튜닝 및 STT 분석
| **최보광** | Documentation  | 보고서 및 기술 문서 작성, 자료 정리

---


MIT License © 2025 Team 5 – SoriBom Project

---
