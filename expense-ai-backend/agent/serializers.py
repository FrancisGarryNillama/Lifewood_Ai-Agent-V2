from rest_framework import serializers
from .models import ChatSession, ChatMessage, GovernanceLog, LongTermMemory


class ChatMessageSerializer(serializers.ModelSerializer):
    class Meta:
        model = ChatMessage
        fields = '__all__'
        read_only_fields = ['session', 'created_at']


class ChatSessionSerializer(serializers.ModelSerializer):
    message_count = serializers.SerializerMethodField()
    last_message = serializers.SerializerMethodField()

    class Meta:
        model = ChatSession
        fields = ['id', 'title', 'created_at', 'updated_at',
                  'is_active', 'message_count', 'last_message']
        read_only_fields = ['user', 'created_at', 'updated_at']

    def get_message_count(self, obj):
        return obj.messages.count()

    def get_last_message(self, obj):
        msg = obj.messages.last()
        if msg:
            return {'role': msg.role, 'content': msg.content[:100], 'created_at': msg.created_at}
        return None


class GovernanceLogSerializer(serializers.ModelSerializer):
    class Meta:
        model = GovernanceLog
        fields = '__all__'
        read_only_fields = ['user', 'created_at']


class LongTermMemorySerializer(serializers.ModelSerializer):
    class Meta:
        model = LongTermMemory
        fields = '__all__'
        read_only_fields = ['user', 'updated_at']