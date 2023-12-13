import json
import asyncio
from channels.generic.websocket import AsyncWebsocketConsumer
import logging


class GameConsumer(AsyncWebsocketConsumer):
	logger = logging.getLogger(__name__)
	ball_position = {'x': 0, 'y': 0}

	async def game_loop(self):
		while True:
			# Update ball's position
			self.ball_position['x'] += 5
			self.ball_position['y'] += 5

			# Send updated position to clients
			await self.update_ball_position()

			# Wait for next frame
			await asyncio.sleep(1/60) 

	async def start_game(self, event):
		self.logger.debug('start_game')
		message = event['message']
		initial_state = event['initial_state']
		await self.channel_layer.group_send(
			self.room_group_name,
			{
				'type': 'game_message',
				'message': 'start_game',
				'initial_state': initial_state,
			}
		)
		asyncio.create_task(self.game_loop())

	async def update_ball_position(self, updated_ball_position):
		self.logger.debug('update_ball_position')
		
		await self.channel_layer.group_send(
			self.room_group_name,
			{
				'type': 'ball_update',
				'ball_position': self.ball_position
			}
		)

	async def connect(self):
		self.room_name = self.scope['url_route']['kwargs']['room_name']
		self.room_group_name = 'game_%s' % self.room_name
		# Join room group
		await self.channel_layer.group_add(
			self.room_group_name,
			self.channel_name
		)

		await self.accept()

	async def disconnect(self, close_code):
		# Leave room group
		await self.channel_layer.group_discard(
			self.room_group_name,	
			self.channel_name
		)

	# Receive message from WebSocket
	async def receive(self, text_data):
		text_data_json = json.loads(text_data)
		message = text_data_json['message']

		if message == 'move_paddle_up':
			# Send a message to both players
			await self.channel_layer.group_send(
				self.room_group_name,
				{
					'type': 'game_message',
					'message': 'Player pressed up arrow'
				}
			)
		elif message == 'start_game':
			await self.channel_layer.group_send(
				self.room_group_name,
				{
					'type': 'game_message',
					'message': 'start_game',
				}
			)
		else:
			await self.channel_layer.group_send(
				self.room_group_name,
				{
					'type': 'game_message',
					'message': message
				}
			)
	# Receive message from room group
	async def game_message(self, event):
		message = event['message']

		# Send message to WebSocket
		await self.send(text_data=json.dumps({
			'message': message
		}))

	async def ball_message(self, event):
		ball_position = event['message']

		# Broadcast the ball's position to all clients
		await self.send(text_data=json.dumps({
			'message': {'x': ball_position['x'], 'y': ball_position['y']}
		}))

