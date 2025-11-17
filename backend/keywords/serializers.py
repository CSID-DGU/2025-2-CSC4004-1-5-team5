from rest_framework import serializers
from .models import Keyword


# 리스트 조회용
class KeywordListSerializer(serializers.ModelSerializer):
    session_id = serializers.UUIDField(source="session.session_id", read_only=True)

    class Meta:
        model = Keyword
        fields = ["id", "session_id", "word", "created_at"]
        read_only_fields = ["id", "session_id", "created_at"]


# 생성용 (session, word 입력받음)
class KeywordCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Keyword
        fields = ["session", "word"]
        extra_kwargs = {
            "session": {"write_only": True}
        }


# KeywordSerializer — 기본 조회용
class KeywordSerializer(serializers.ModelSerializer):
    session_id = serializers.UUIDField(source="session.session_id", read_only=True)

    class Meta:
        model = Keyword
        fields = ["id", "session_id", "word", "created_at"]
        read_only_fields = ["id", "session_id", "created_at"]
