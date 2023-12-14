import json
import asyncio
from channels.generic.websocket import AsyncWebsocketConsumer
import logging
from pong_app.models import GameRoom
from asgiref.sync import sync_to_async

logging.basicConfig(level=logging.DEBUG)

class GameConsumer(AsyncWebsocketConsumer):
	logger = logging.getLogger(__name__)
	ball_position = {'x': 0, 'y': 0}
	ball_speed_x = 4
	ball_speed_y = 4
	ball_radius = 10
	paddle1_position = {'x': 0, 'y': 0}
	paddle2_position = {'x': 0, 'y': 0}
	game_room = None
	isGameRunning = True
	connected_users = 0

	async def ball_update(self, event):
		try:
			ball_position = event['ball_position']
			if self.game_room is None:
				self.logger.error(f"GameRoom with name '{self.room_name}' does not exist.")
				return

			self.game_room.ball_position = f"{ball_position['x']},{ball_position['y']}"
			await sync_to_async(self.game_room.save)()

			await self.channel_layer.group_send(
				self.room_group_name,
				{
					'type': 'game_message',
					'message': 'ball_update',	
					'ball_position': json.dumps(ball_position)
				}
			)
		except Exception as e:
			self.logger.error(f"An error occurred while updating the ball position: {e}")

	async def paddle1_update(self, event):
		try:
			paddle1_position = event['paddle1_position']
			if self.game_room is None:
				self.logger.error(f"GameRoom with name '{self.room_name}' does not exist.")
				return

			self.game_room.paddle1_position = f"{paddle1_position['x']},{paddle1_position['y']}"
			await sync_to_async(self.game_room.save)()

			await self.channel_layer.group_send(
				self.room_group_name,
				{
					'type': 'game_message',
					'message': 'paddle1_update',	
					'paddle1_position': json.dumps(paddle1_position)
				}
			)
		except Exception as e:
			self.logger.error(f"An error occurred while updating the paddle1 position: {e}")

	async def paddle2_update(self, event):
		try:
			paddle2_position = event['paddle2_position']
			if self.game_room is None:
				self.logger.error(f"GameRoom with name '{self.room_name}' does not exist.")
				return

			self.game_room.paddle2_position = f"{paddle2_position['x']},{paddle2_position['y']}"
			await sync_to_async(self.game_room.save)()

			await self.channel_layer.group_send(
				self.room_group_name,
				{
					'type': 'game_message',
					'message': 'paddle2_update',	
					'paddle2_position': json.dumps(paddle2_position)
				}
			)
		except Exception as e:
			self.logger.error(f"An error occurred while updating the paddle2 position: {e}")


	async def game_loop(self):
		while self.isGameRunning:
			self.ball_position['x'] += self.ball_speed_x
			self.ball_position['y'] += self.ball_speed_y

			# Check if the ball hits the wall in the x direction
			if self.ball_position['x'] - self.ball_radius <= 0 or self.ball_position['x'] + self.ball_radius >= 800:
				self.ball_speed_x *= -1 # Reverse the x direction

			# Check if the ball hits the wall in the y direction
			if self.ball_position['y'] - self.ball_radius <= 0 or self.ball_position['y'] + self.ball_radius >= 600:
				self.ball_speed_y *= -1 # Reverse the y direction

			await self.ball_update({'ball_position': self.ball_position})

			await asyncio.sleep(1/60)


	async def connect(self):
		self.room_name = self.scope['url_route']['kwargs']['room_name']
		self.room_group_name = 'game_%s' % self.room_name
		# Join room group
		try:
			self.game_room = await sync_to_async(GameRoom.objects.get)(name=self.room_name)
		except GameRoom.DoesNotExist:
			self.logger.error(f"GameRoom with name '{self.room_name}' does not exist.")
			return

		await self.channel_layer.group_add(
			self.room_group_name,
			self.channel_name
		)
		await self.accept()
		self.connected_users += 1

	async def disconnect(self, close_code):
		# Leave room group
		await self.channel_layer.group_discard(
			self.room_group_name,	
			self.channel_name
		)
		self.isGameRunning = False
		self.connected_users -= 1
		if self.connected_users <= 0:
			await sync_to_async(self.game_room.delete)()

	# Receive message from WebSocket
	async def receive(self, text_data):
		text_data_json = json.loads(text_data)
		message = text_data_json['message']
		if message == 'move_paddle_up':
			paddle1_position = text_data_json['paddle1_position']
			await self.paddle1_update({'paddle1_position': paddle1_position})
		elif message == 'start_game':
			self.logger.debug('start_game')
			#board is 800x600 start ball in middle
			self.ball_position = {'x': 400, 'y': 300}
			asyncio.create_task(self.game_loop())
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
			'message': message,
			'ball_position': event['ball_position'] if 'ball_position' in event else '',
			'paddle1_position': event['paddle1_position'] if 'paddle1_position' in event else '',
			'paddle2_position': event['paddle2_position'] if 'paddle2_position' in event else ''
		}))

		
