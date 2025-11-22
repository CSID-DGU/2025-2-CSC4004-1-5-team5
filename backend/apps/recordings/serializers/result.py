from rest_framework import serializers
from apps.recordings.models import Session

class ResultSerializer(serializers.ModelSerializer):
    class Meta:
        model = Session
        fields = ["id", "full_text", "summary"]
