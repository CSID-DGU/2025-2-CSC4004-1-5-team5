from rest_framework import serializers
from ..models import Session, AudioChunk
from apps.broadcasts.models import Broadcast
from apps.keywords.models import Alert


class SessionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Session
        fields = ["id", "status", "progress", "created_at", "expired_at"]


class SessionStatusSerializer(serializers.ModelSerializer):
    total_broadcasts = serializers.IntegerField(source="broadcasts.count", read_only=True)

    class Meta:
        model = Session
        fields = [
            "id",
            "status",
            "progress",
            "total_broadcasts",
        ]



class AudioUploadSerializer(serializers.Serializer):
    session_id = serializers.IntegerField()
    audio_file = serializers.FileField()

    def validate(self, data):
        from apps.recordings.models import Session
        session_id = data["session_id"]

        try:
            data["session"] = Session.objects.get(id=session_id)
        except Session.DoesNotExist:
            raise serializers.ValidationError("Invalid session_id")

        return data




class BroadcastSerializer(serializers.ModelSerializer):
    keywords_detected = serializers.StringRelatedField(many=True)

    class Meta:
        model = Broadcast
        fields = [
            "id",
            "audio_chunk",
            "summary",
            "full_text",
            "keywords_detected",
            "confidence_avg"
        ]