from rest_framework import serializers
from .models import Room, Message

class MessageSerializer(serializers.ModelSerializer):
    sender_username = serializers.CharField(source='sender.username', read_only=True)

    class Meta:
        model = Message
        fields = ['id', 'room', 'sender', 'sender_username', 'content', 'timestamp']
        read_only_fields = ['sender', 'timestamp']


class RoomSerializer(serializers.ModelSerializer):
    participants_usernames = serializers.SerializerMethodField()
    last_message = serializers.SerializerMethodField()
    unread_count = serializers.SerializerMethodField()

    class Meta:
        model = Room
        fields = ['id', 'name', 'participants', 'participants_usernames', 'last_message', 'unread_count', 'created_at']

    def get_participants_usernames(self, obj):
        return [user.username for user in obj.participants.all()]

    def get_last_message(self, obj):
        last_msg = obj.messages.order_by('-timestamp').first()
        if last_msg:
            return {
                'content': last_msg.content,
                'timestamp': str(last_msg.timestamp),
                'sender': last_msg.sender.username
            }
        return None

    def get_unread_count(self, obj):
        return 0