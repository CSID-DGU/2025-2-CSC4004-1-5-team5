from rest_framework import serializers
from .models import Keyword


class KeywordSerializer(serializers.ModelSerializer):
    session_id = serializers.UUIDField(source="session.session_id", read_only=True)

    class Meta:
        model = Keyword
        fields = ["id", "session_id", "word", "created_at"]
        read_only_fields = ["id", "session_id", "created_at"]
