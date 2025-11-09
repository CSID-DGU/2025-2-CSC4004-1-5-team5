from django.contrib import admin
from .models import Session, AudioChunk, Broadcast, Transcript


# ==========================================================
# Session 
# ==========================================================
@admin.register(Session)
class SessionAdmin(admin.ModelAdmin):
    list_display = ("id", "status", "progress", "created_at", "expired_at", "ended_at")
    list_filter = ("status",)
    search_fields = ("id",)
    ordering = ("-created_at",)
    readonly_fields = ("created_at", "expired_at")
    list_display_links = ("id",)
    list_per_page = 20


# ==========================================================
# AudioChunk 
# ==========================================================
@admin.register(AudioChunk)
class AudioChunkAdmin(admin.ModelAdmin):
    list_display = ("id", "session", "status", "duration", "file_path", "created_at")
    list_filter = ("status", "created_at")
    search_fields = ("id", "file_path", "session__id")
    ordering = ("-created_at",)
    list_display_links = ("id", "file_path")
    list_per_page = 20


# ==========================================================
# Broadcast 
# ==========================================================
@admin.register(Broadcast)
class BroadcastAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "session",
        "audio_chunk",
        "confidence_avg",
        "created_at",
        "detected_keywords",
    )
    list_filter = ("created_at",)
    search_fields = ("id", "session__id", "full_text", "summary")
    ordering = ("-created_at",)
    list_display_links = ("id",)
    list_per_page = 20

    @admin.display(description="Detected Keywords")
    def detected_keywords(self, obj):
        """감지된 키워드들을 쉼표로 나열"""
        return ", ".join([k.word for k in obj.keywords_detected.all()]) or "-"


# ==========================================================
# Transcript 
# ==========================================================
@admin.register(Transcript)
class TranscriptAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "session",
        "total_broadcasts",
        "total_keywords",
        "accuracy_avg",
        "created_at",
    )
    list_filter = ("created_at",)
    search_fields = ("id", "session__id", "summary")
    ordering = ("-created_at",)
    list_display_links = ("id",)
    readonly_fields = ("created_at",)
    list_per_page = 20
