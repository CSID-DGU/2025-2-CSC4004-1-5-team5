from django.contrib import admin
from .models import Keyword, Alert


# ==========================================================
# Keyword Admin
# ==========================================================
@admin.register(Keyword)
class KeywordAdmin(admin.ModelAdmin):
    list_display = ("id", "word", "session", "created_at")
    search_fields = ("word", "session__id")
    list_filter = ("created_at",)
    ordering = ("word",)
    list_display_links = ("id", "word")
    list_per_page = 30


# ==========================================================
# Alert Admin
# ==========================================================
@admin.register(Alert)
class AlertAdmin(admin.ModelAdmin):
    list_display = ("id", "keyword", "broadcast", "detected_at", "session_display")
    search_fields = ("keyword__word", "broadcast__id", "keyword__session__id")
    list_filter = ("detected_at",)
    ordering = ("-detected_at",)
    list_per_page = 30

    @admin.display(description="Session")
    def session_display(self, obj):
        """감지된 키워드가 속한 세션 ID"""
        return obj.keyword.session.id
