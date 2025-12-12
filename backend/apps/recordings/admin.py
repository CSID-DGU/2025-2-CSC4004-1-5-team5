from django.contrib import admin
from .models import Session, AudioChunk


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