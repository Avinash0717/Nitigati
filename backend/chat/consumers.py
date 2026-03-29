import json
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from .models import Room, Message
from django.contrib.auth.models import AnonymousUser
from rest_framework.authtoken.models import Token
from urllib.parse import parse_qs

@database_sync_to_async
def get_user_from_token(token_key):
    try:
        return Token.objects.get(key=token_key).user
    except Token.DoesNotExist:
        return AnonymousUser()

class ChatConsumer(AsyncWebsocketConsumer):

    async def connect(self):
        self.room_name = self.scope['url_route']['kwargs']['room_name']
        self.room_group_name = f'chat_{self.room_name}'

        # Internal Authentication from query string
        query_params = parse_qs(self.scope['query_string'].decode())
        token_key = query_params.get('token', [None])[0]
        
        if token_key:
            self.scope['user'] = await get_user_from_token(token_key)
        
        # Ensure user is authenticated
        user = self.scope.get('user', AnonymousUser())
        if user.is_anonymous:
            await self.close()
            return

        # Check if user is a participant of the room
        is_participant = await self.check_participation(user, self.room_name)
        if not is_participant:
            await self.close()
            return

        await self.channel_layer.group_add(
            self.room_group_name,
            self.channel_name
        )
        await self.accept()

    async def disconnect(self, close_code):
        if hasattr(self, 'room_group_name'):
            await self.channel_layer.group_discard(
                self.room_group_name,
                self.channel_name
            )

    async def receive(self, text_data):
        data = json.loads(text_data)
        message = data.get('message')
        if not message:
            return
            
        user = self.scope['user']
        saved = await self.save_message(user, self.room_name, message)

        await self.channel_layer.group_send(
            self.room_group_name,
            {
                'type': 'chat_message',
                'message': message,
                'sender': user.username,
                'timestamp': str(saved.timestamp),
            }
        )

    async def chat_message(self, event):
        await self.send(text_data=json.dumps({
            'message': event['message'],
            'sender': event['sender'],
            'timestamp': event['timestamp'],
        }))

    @database_sync_to_async
    def save_message(self, user, room_name, message):
        room = Room.objects.get(name=room_name)
        return Message.objects.create(room=room, sender=user, content=message)

    @database_sync_to_async
    def check_participation(self, user, room_name):
        try:
            return Room.objects.get(name=room_name).participants.filter(id=user.id).exists()
        except Room.DoesNotExist:
            return False