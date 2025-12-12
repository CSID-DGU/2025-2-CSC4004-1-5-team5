from rest_framework import serializers
from ..models import Alert

# ============================================================
#  Alert Serializers
# ============================================================

class KeywordAlertSerializer(serializers.ModelSerializer):
    chunk_id = serializers.IntegerField(source="broadcast.audio_chunk.id", read_only=True)
    keyword = serializers.CharField(source="keyword.word", read_only=True)

    class Meta:
        model = Alert
        fields = ["chunk_id", "keyword", "detected_at"]