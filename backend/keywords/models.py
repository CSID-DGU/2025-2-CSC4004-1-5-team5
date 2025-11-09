from django.db import models
from recordings.models import Session, Broadcast


# ==========================================================
#  Keyword (사용자 정의 감지 단어)
# ==========================================================
class Keyword(models.Model):
    session = models.ForeignKey(Session, on_delete=models.CASCADE, related_name="keywords")
    word = models.CharField(max_length=50)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ("session", "word")
        ordering = ["word"]
        verbose_name = "Keyword"
        verbose_name_plural = "Keywords"

    def __str__(self):
        return f"[{self.id}] '{self.word}', session={self.session_id}"



# ==========================================================
#  Alert (감지 로그 — 내부 전용)
# ==========================================================
class Alert(models.Model):
    keyword = models.ForeignKey(Keyword, on_delete=models.CASCADE, related_name="alerts")
    broadcast = models.ForeignKey(Broadcast, on_delete=models.CASCADE, related_name="alerts")
    detected_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-detected_at"]
        verbose_name = "Alert"
        verbose_name_plural = "Alerts"

    def __str__(self):
        return f"[{self.id}] keyword='{self.keyword.word}', broadcast={self.broadcast_id}, time={self.detected_at:%H:%M:%S}"
