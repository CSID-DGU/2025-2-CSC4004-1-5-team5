from django.db import models
from django.db.models import JSONField 

from apps.recordings.models import Session, AudioChunk

# ==========================================================
#  Broadcast (안내방송 단위 인식 결과)
# ==========================================================
class Broadcast(models.Model):
    session = models.ForeignKey(
        Session, 
        on_delete=models.CASCADE, 
        related_name="broadcasts")
    audio_chunk = models.ForeignKey(AudioChunk, on_delete=models.SET_NULL, null=True, blank=True, related_name="broadcasts")

    full_text = models.TextField(help_text="STT 변환된 안내방송 텍스트")
    summary = models.TextField(blank=True, help_text="LLM 요약 결과")
    confidence_avg = models.FloatField(default=0)

    # 감지된 키워드는 keyword 앱의 Keyword 모델과 연결 (ManyToMany)
    keywords_detected = models.ManyToManyField(
        "keywords.Keyword",
        related_name="broadcasts",
        blank=True,
        help_text="이 방송에서 감지된 키워드"
    )

    start_time = models.DateTimeField(null=True, blank=True)
    end_time = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def detected_words(self):
        return [k.word for k in self.keywords_detected.all()]

    def __str__(self):
        kws = ", ".join(self.detected_words()) or "No keywords"
        return f"[{self.id}] session={self.session_id}, conf={self.confidence_avg:.2f}, kws=[{kws}]"

    class Meta:
        ordering = ["-created_at"]
        verbose_name = "Broadcast"
        verbose_name_plural = "Broadcast"


# ==========================================================
#  Transcript (세션 전체 요약 결과)
# ==========================================================
class Transcript(models.Model):
    session = models.OneToOneField(Session, on_delete=models.CASCADE, related_name="transcript")

    # 세션 전체 요약
    summary = models.TextField(blank=True)

    # 세션 전체 합쳐진 텍스트(선택)
    full_text = models.TextField(blank=True)

    # 전체 announcements 리스트 그대로 저장
    timeline = JSONField(default=list)

    # 통계 정보
    total_broadcasts = models.IntegerField(default=0)
    total_keywords = models.IntegerField(default=0)
    accuracy_avg = models.FloatField(default=0)

    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"[{self.id}] session={self.session_id}, broadcasts={self.total_broadcasts}, keywords={self.total_keywords}"

    class Meta:
        ordering = ["-created_at"]
        verbose_name = "Transcript"
        verbose_name_plural = "Transcripts"
