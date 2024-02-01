from django.urls import re_path
from . import consumers
from channels.routing import ProtocolTypeRouter, URLRouter
from channels.auth import AuthMiddlewareStack

websocket_urlpatterns = [
	re_path(r'ws/game/(?P<room_name>\w+)/$', consumers.GameConsumer.as_asgi()),
	re_path(r'ws/tournament/$', consumers.TournamentConsumer.as_asgi()),
	re_path(r'ws/tournament_lobby/(?P<tournament_id>\w+)/$', consumers.TournamentLobbyConsumer.as_asgi()),
	re_path(r'ws/tournament_game/(?P<room_name>\w+)/$', consumers.TournamentGameConsumer.as_asgi()),
	re_path(r'ws/chat/(?P<room_name>\w+)/$', consumers.ChatConsumer.as_asgi()),
	re_path(r'ws/friendList/(?P<user_id>\w+)/$', consumers.FriendListConsumer.as_asgi()),
]