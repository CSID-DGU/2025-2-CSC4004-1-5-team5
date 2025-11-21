from rest_framework import serializers
from .models import Keyword, Alert
from apps.recordings.models import Session


# ============================================================
#  Keyword Serializers
# ============================================================

class KeywordListSerializer(serializers.ModelSerializer):
    session_id = serializers.IntegerField(source="session.id", read_only=True)

    class Meta:
        model = Keyword
        fields = ["id", "session_id", "word", "created_at"]
        read_only_fields = ["id", "session_id", "created_at"]


class KeywordCreateSerializer(serializers.Serializer):
    session_id = serializers.IntegerField()
    keywords = serializers.ListField(
        child=serializers.CharField(max_length=50)
    )

    def create(self, validated_data):
        session_id = validated_data["session_id"]
        words = validated_data["keywords"]

        session = Session.objects.get(id=session_id)

        created = []
        for w in words:
            keyword, _ = Keyword.objects.get_or_create(
                session=session,
                word=w
            )
            created.append(keyword)

        return created
        
    
# ============================================================
#  Alert Serializers
# ============================================================

class KeywordAlertSerializer(serializers.ModelSerializer):
    chunk_id = serializers.IntegerField(source="broadcast.audio_chunk.id", read_only=True)
    keyword = serializers.CharField(source="keyword.word", read_only=True)

    class Meta:
        model = Alert
        fields = [
            "chunk_id",
            "keyword",
            "detected_at"
        ]
