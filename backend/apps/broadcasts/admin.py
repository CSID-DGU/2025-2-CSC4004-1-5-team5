from django.contrib import admin
from .models import Broadcast, Transcript

# Register your models here.
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
