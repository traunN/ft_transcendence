import json
import asyncio
from channels.generic.websocket import AsyncWebsocketConsumer
import logging
from pong_app.models import GameRoom
from asgiref.sync import sync_to_async
from asgiref.sync import async_to_sync

logging.basicConfig(level=logging.DEBUG)

class GameConsumer(AsyncWebsocketConsumer):
	logger = logging.getLogger(__name__)
	ball_position = {'x': 0, 'y': 0}
	ball_speed_x = 2
	ball_speed_y = 2
	ball_radius = 10
	paddle1_position = {'x': 0, 'y': 0}
	paddle2_position = {'x': 0, 'y': 0}
	game_room = None
	isGameRunning = True
	connected_users = 0
	score1 = 0
	score2 = 0
	score_threshold = 5
	game_over = False


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
			if self.game_over:
				return
			paddle1_position = event['paddle1_position']
			if isinstance(paddle1_position, str):
				paddle1_position = json.loads(paddle1_position)

			if self.game_room is None:
				self.logger.error(f"GameRoom with name '{self.room_name}' does not exist.")
				return

			paddle1_position['y'] = max(50, min(550, paddle1_position['y']))
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
			if self.game_over:
				return
			paddle2_position = event['paddle2_position']
			if isinstance(paddle2_position, str):
				paddle2_position = json.loads(paddle2_position)

			if self.game_room is None:
				self.logger.error(f"GameRoom with name '{self.room_name}' does not exist.")
				return

			paddle2_position['y'] = max(50, min(550, paddle2_position['y']))
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
		try:
			while self.isGameRunning:
				if self.score1 >= self.score_threshold or self.score2 >= self.score_threshold:
					self.game_over = True
					self.gameState = 'waiting'
					if self.score1 >= self.score_threshold:
						user1 = (await sync_to_async(self.game_room.roomplayer_set.all)())[0].user
						user2 = (await sync_to_async(self.game_room.roomplayer_set.all)())[1].user
						user1.wins += 1
						user2.loses += 1
						await sync_to_async(user1.save)()
						await sync_to_async(user2.save)()
					await sync_to_async(self.game_room.save)()
					await self.channel_layer.group_send(
						self.room_group_name,
						{
							'type': 'game_message',
							'message': 'game_over',	
							'score1': self.score1,
							'score2': self.score2
						}
					)
					return
				self.ball_position['x'] += self.ball_speed_x
				self.ball_position['y'] += self.ball_speed_y

				paddle1_position = self.paddle1_position
				paddle2_position = self.paddle2_position
				if isinstance(paddle1_position, str):
					paddle1_position = json.loads(paddle1_position)
				if isinstance(paddle2_position, str):
					paddle2_position = json.loads(paddle2_position)

				if self.ball_position['x'] - self.ball_radius <= 0:
					self.score2 += 1
					self.ball_position = {'x': 400, 'y': 300}
					self.ball_speed_x = 2
					self.ball_speed_y = 2
					self.game_room.score2 += 1
					await sync_to_async(self.game_room.save)()
				elif self.ball_position['x'] + self.ball_radius >= 800:
					self.score1 += 1
					self.ball_position = {'x': 400, 'y': 300}
					self.ball_speed_x = 2
					self.ball_speed_y = 2
					self.game_room.score1 += 1
					await sync_to_async(self.game_room.save)()

				await self.channel_layer.group_send(
					self.room_group_name,
					{
						'type': 'game_message',
						'message': 'score_update',	
						'score1': self.score1,
						'score2': self.score2
					}
				)

				if self.ball_position['x'] - self.ball_radius <= 0 or self.ball_position['x'] + self.ball_radius >= 800:
					self.ball_speed_x *= -1

				if self.ball_position['y'] - self.ball_radius <= 0 or self.ball_position['y'] + self.ball_radius >= 600:
					self.ball_speed_y *= -1

				if (
					paddle1_position['x'] - 20 <= self.ball_position['x'] <= paddle1_position['x'] + 20 and
					paddle1_position['y'] - 50 - self.ball_radius <= self.ball_position['y'] <= paddle1_position['y'] + 50
					):
					self.ball_speed_x *= -1
					if self.ball_position['y'] < paddle1_position['y'] -50 or self.ball_position['y'] > paddle1_position['y'] + 50:
						self.ball_speed_y *= -1

				if (
					paddle2_position['x'] - 20 <= self.ball_position['x'] <= paddle2_position['x'] + 20 and
					paddle2_position['y'] - 50 - self.ball_radius <= self.ball_position['y'] <= paddle2_position['y'] + 50
					):
					self.ball_speed_x *= -1
					if self.ball_position['y'] < paddle2_position['y'] - 50 or self.ball_position['y'] > paddle2_position['y'] + 50:
						self.ball_speed_y *= -1


				await self.ball_update({'ball_position': self.ball_position})
				await asyncio.sleep(1 / 120)
		except Exception as e:
			self.logger.error(f"An error occurred while running the game loop: {e}")


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
		if message == 'paddle_update':
			if text_data_json['paddle'] == 'paddle1':
				self.paddle1_position = text_data_json['position']
				await self.paddle1_update({'paddle1_position': self.paddle1_position})
			elif text_data_json['paddle'] == 'paddle2':
				self.paddle2_position = text_data_json['position']
				await self.paddle2_update({'paddle2_position': self.paddle2_position})
		elif message == 'start_game':
			self.logger.debug('start_game')
			self.ball_position = {'x': 400, 'y': 300}
			self.paddle1_position = {'x': 10, 'y': 300}
			self.paddle2_position = {'x': 790, 'y': 300}
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
			'paddle2_position': event['paddle2_position'] if 'paddle2_position' in event else '',
			'game_over': self.game_over,
			'score1': event['score1'] if 'score1' in event else '',
			'score2': event['score2'] if 'score2' in event else ''
		}))
