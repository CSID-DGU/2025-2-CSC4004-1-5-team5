from rest_framework import serializers
from .models import Session, AudioChunk, Broadcast
from keywords.models import Alert


class SessionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Session
        fields = ["id", "status", "progress", "created_at", "expired_at"]


class SessionStatusSerializer(serializers.ModelSerializer):
    total_broadcasts = serializers.IntegerField(source="broadcast_set.count", read_only=True)
    total_keywords = serializers.IntegerField(source="alert_set.count", read_only=True)

    class Meta:
        model = Session
        fields = [
            "id",
            "status",
            "progress",
            "total_broadcasts",
            "total_keywords"
        ]


class AudioUploadSerializer(serializers.Serializer):
    session_id = serializers.UUIDField()
    audio_file = serializers.FileField()
    duration = serializers.FloatField(required=False)

    def validate_session_id(self, value):
        try:
            session = Session.objects.get(id=value)
        except Session.DoesNotExist:
            raise serializers.ValidationError("세션 없음")
        return session

    def validate(self, attrs):
        attrs["session"] = attrs["session_id"]
        del attrs["session_id"]
        return attrs


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


class ResultSerializer(serializers.ModelSerializer):
    timeline = BroadcastSerializer(source="broadcast_set", many=True)

    class Meta:
        model = Session
        fields = [
            "id",
            "progress",
            "timeline"
        ]
