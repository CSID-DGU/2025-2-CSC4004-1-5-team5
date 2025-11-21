from datetime import timedelta
from django.db import models
from django.utils import timezone


# ==========================================================
#  Session (세션 단위 녹음 흐름)
# ==========================================================
def default_expired_time():
        """세션 만료 기본값 (생성 시점 + 1시간)"""
        return timezone.now() + timedelta(hours=1)

class Session(models.Model):
    STATUS_CHOICES = [
        ("RECORDING", "Recording"),
        ("PROCESSING", "Processing"),
        ("COMPLETE", "Complete"),
        ("EXPIRED", "Expired"),
    ]

    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="RECORDING")
    progress = models.FloatField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    expired_at = models.DateTimeField(default=default_expired_time)
    ended_at = models.DateTimeField(null=True, blank=True)

    @property
    def is_expired(self):
        return timezone.now() > self.expired_at

    def __str__(self):
        return f"[{self.id}] status={self.status}, progress={self.progress}%"

    class Meta:
        ordering = ["-created_at"]
        verbose_name = "Session"
        verbose_name_plural = "Session"
    

# ==========================================================
#  AudioChunk (10초 단위 녹음 파일)
# ==========================================================
class AudioChunk(models.Model):
    STATUS_CHOICES = [
        ("PENDING", "Pending"),
        ("PROCESSING", "Processing"),
        ("COMPLETE", "Complete"),
    ]

    session = models.ForeignKey(Session, on_delete=models.CASCADE, related_name="chunks")
    file_path = models.CharField(max_length=255)
    duration = models.FloatField(null=True, blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="PENDING")
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"[{self.id}] session={self.session_id}, status={self.status}, path='{self.file_path}'"
    
    class Meta:
        ordering = ["-created_at"]
        verbose_name = "Audio Chunk"
        verbose_name_plural = "Audio Chunks"

