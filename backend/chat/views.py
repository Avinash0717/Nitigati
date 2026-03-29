from django.shortcuts import render

# Create your views here.
from rest_framework import viewsets, permissions
from .models import Room, Message
from .serializers import RoomSerializer, MessageSerializer
from django.contrib.auth import get_user_model
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db.models import Q

User = get_user_model()

class RoomViewSet(viewsets.ModelViewSet):
    serializer_class = RoomSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Room.objects.filter(participants=self.request.user)

    def list(self, request, *args, **kwargs):
        # Only return rooms that have at least one message for the lobby
        queryset = self.get_queryset().filter(messages__isnull=False).distinct()
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['post'])
    def get_or_create_room(self, request):
        provider_id = request.data.get('provider_id')
        if not provider_id:
            return Response({'error': 'provider_id is required'}, status=400)
        
        try:
            # The frontend sends provider_id which is the Provider's uuid.
            # In our system, the User's username is set to the Provider's uuid.
            provider = User.objects.get(username=str(provider_id))
        except (User.DoesNotExist, ValueError):
            return Response({'error': 'Provider not found'}, status=404)

        # Find a room where both the requester and the provider are participants
        # For a 1-on-1 chat, we can search for a room that has exactly these two participants.
        # However, for simplicity, we'll just find any room that contains both.
        room = Room.objects.filter(participants=request.user).filter(participants=provider).first()

        if not room:
            # Create a unique name for the room
            user_ids = sorted([request.user.id, provider.id])
            room_name = f"chat_{user_ids[0]}_{user_ids[1]}"
            room, created = Room.objects.get_or_create(name=room_name)
            room.participants.add(request.user, provider)
            room.save()

        serializer = self.get_serializer(room)
        return Response(serializer.data)


class MessageViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = MessageSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        room_name = self.request.query_params.get('room')
        if room_name:
            return Message.objects.filter(room__name=room_name)
        return Message.objects.none()