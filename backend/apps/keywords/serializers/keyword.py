from rest_framework import serializers
from ..models import Keyword
from apps.recordings.models import Session


# =================================================================
# Keyword 조회 Serializer
# =================================================================

class KeywordListSerializer(serializers.ModelSerializer):
    session_id = serializers.IntegerField(source="session.id", read_only=True)
    keyword = serializers.CharField(source='word')

    class Meta:
        model = Keyword
        fields = ["id", "session_id", "keyword", "created_at"]
        read_only_fields = ["id", "session_id", "created_at"]


# =================================================================
# Keyword 생성 Serializer
# =================================================================

class KeywordCreateSerializer(serializers.Serializer):
    session_id = serializers.IntegerField()
    keywords = serializers.ListField(
        child=serializers.CharField(max_length=50)
    )

    def create(self, validated_data):
        session_id = validated_data["session_id"]
        words = validated_data["keywords"]

        session = Session.objects.get(id=session_id)

        created_keywords = []
        for word in words:
            keyword, _ = Keyword.objects.get_or_create(
                session=session,
                word=word
            )
            created_keywords.append(keyword)

        return created_keywords
        

