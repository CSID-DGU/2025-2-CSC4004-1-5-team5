## 🧠 Soribom AI 폴더 구조 및 설명 (`/ai`)

본 폴더는 **AI 서버 및 모델 학습 과정에 사용된 코드의 백업용 저장소**입니다.
실제 서비스 운영은 Colab T4 환경에서 이루어졌으며,
이 폴더는 **연구 및 성능 보고용**으로 제출되었습니다.

---

### 📁 폴더 구조

```
ai/
│
├── ai_server/
│   └── ai_server.ipynb         # 실시간 음성 인식 Flask 서버 (Whisper Large-v3 + DCCRNet)
│
├── enhance_model/
│   ├── best_model_stt_final.ipynb  # DCCRNet (잡음 제거) 학습 코드
│   └── convtasnet.ipynb            # ConvTasNet 모델 실험 코드
│
└── stt_finetuning/
    └── stt_finetuning.ipynb        # Whisper Large-v3 파인튜닝 (한국어+영어 STT)
```

---

### 🤖 `ai_server.ipynb`

**기능:**

* Flask + Cloudflare 기반 AI 서버
* 입력된 10초 단위 음성 파일을 Whisper + DCCRNet으로 STT 처리
* STT 결과를 Django 서버로 전송 및 저장

**사용 기술:**

* `PyTorch`, `torchaudio`, `transformers`
* `Whisper Large-v3 (Fine-tuned)`
* `DCCRNet (Noise Suppression)`
* `Cloudflare Tunnel` (Colab GPU 서버 외부 노출용)

**추가 기능:**

* Clean 음성(`clean.wav`) 자동 생성 및 Django 업로드
* GPU/CPU 성능 비교 테스트 포함

| 항목           | EC2     | CPU   | GPU (Colab T4) | 향상률                     |
| ------------ | ------- | ----- | -------------- | ----------------------- |
| 10초 음성 추론 속도 | Timeout | 약 50초 | **2.1초**       | **약 95.8% 단축 (≈ 24배↑)** |

---

### 🎧 `enhance_model/`

**기능:**

* DCCRNet 및 ConvTasNet 기반 음성 향상 모델 학습 코드
* 실내/지하철 환경의 잡음 제거 성능 실험

**내용:**

* `best_model_stt_final.ipynb`: 최종 학습 및 모델 저장
* `convtasnet.ipynb`: 비교 실험용 모델 학습

**결과:**

* DCCRNet이 ConvTasNet 대비 **SNR +2.3dB 향상**
* Whisper STT 정확도 기준 약 **4%p 개선**

---

### 🗣️ `stt_finetuning/`

**기능:**

* Whisper Large-v3를 기반으로 한 한국어/영어 이중언어 STT 파인튜닝
* 안내방송 데이터셋 및 공공 음성 데이터로 학습

**결과:**

* Base 모델 대비 WER(Word Error Rate) **-8.4% 감소**
* “이번 역은 ~입니다.” 등 지하철 안내방송 문맥 복원 성능 향상

---

### 💡 비고

* 본 폴더는 **보고용/백업용 코드**입니다. 실제로 동작하기 위해서는 라이브러리 및 env 파일 설정, 의존성 설정이 필요합니다.
* 학습 데이터는 저작권 문제로 포함되지 않습니다.
* 모델 가중치(`.pth`)는 GitHub에 업로드되지 않으며, 별도 보관됩니다.
