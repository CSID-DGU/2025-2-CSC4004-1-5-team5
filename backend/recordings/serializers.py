from rest_framework import serializers
from .models import Session, AudioChunk, Broadcast, Transcript


# --------------------------------------------------------
# Session
# --------------------------------------------------------
class SessionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Session
        fields = ["id", 
                "session_id", 
                "status", 
                "progress", 
                "created_at", 
                "expired_at", 
                "ended_at"]