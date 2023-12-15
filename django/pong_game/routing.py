from django.urls import re_path
from . import consumers
from channels.routing import ProtocolTypeRouter, URLRouter
from channels.auth import AuthMiddlewareStack

websocket_urlpatterns = [
	re_path(r'ws/game/(?P<room_name>\w+)/$', consumers.GameConsumer.as_asgi()),
]