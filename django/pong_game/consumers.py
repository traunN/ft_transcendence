import json
import asyncio
from channels.generic.websocket import AsyncWebsocketConsumer
import logging
from pong_app.models import GameRoom
from asgiref.sync import sync_to_async
from asgiref.sync import async_to_sync
from channels.db import database_sync_to_async
import math
import random

class GameConsumer(AsyncWebsocketConsumer):
	logger = logging.getLogger(__name__)
	ball_position = {'x': 0, 'y': 0}
	ball_speed_x = 2.5
	ball_speed_y = 2.5
	ball_radius = 10
	paddle1_position = {'x': 0, 'y': 0}
	paddle2_position = {'x': 0, 'y': 0}
	normalized_relative_intersect_y = 0
	inverted_normalized_relative_intersect_y = 0
	bounce_angle = 0
	max_bounce_angle = 0
	game_room = None
	isGameRunning = True
	connected_users = 0
	score1 = 0
	score2 = 0
	score_threshold = 5
	game_over = False
	users = []
	user1 = None
	user2 = None


	@database_sync_to_async
	def get_game_room(self):
		return GameRoom.objects.get(name=self.room_name)

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
				try:
					paddle1_position = json.loads(paddle1_position)
				except json.JSONDecodeError:
					self.logger.error(f"Invalid JSON data for paddle1_position: {paddle1_position}")
					return

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
				try:
					paddle2_position = json.loads(paddle2_position)
				except json.JSONDecodeError:
					self.logger.error(f"Invalid JSON data for paddle2_position: {paddle2_position}")
					return

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
			self.users = await sync_to_async(lambda: [player.user for player in self.game_room.roomplayer_set.all()])()
			self.user1 = self.users[0]
			if len(self.users) > 1:
				self.user2 = self.users[1]
			else:
				self.user2 = self.user1
			while self.isGameRunning:
				self.game_room = await sync_to_async(GameRoom.objects.get)(name=self.room_name)
				if self.score1 >= self.score_threshold or self.score2 >= self.score_threshold:
					self.game_over = True
					self.gameState = 'waiting'
					if self.score1 >= self.score_threshold:
						self.user1.wins += 1
						self.user2.loses += 1
					else:
						self.user2.wins += 1
						self.user1.loses += 1
					await sync_to_async(self.user1.save)()
					await sync_to_async(self.user2.save)()
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
				
				raw_paddle1_position = self.game_room.paddle1_position
				raw_paddle2_position = self.game_room.paddle2_position

				if not raw_paddle1_position or not raw_paddle2_position:
					self.logger.error("Paddle positions are not set in the game room.")
					return

				try:
					json_objects = raw_paddle1_position.split(",")
					paddle1_positions = [json.loads(obj) for obj in json_objects]

					json_objects = raw_paddle2_position.split(",")
					paddle2_positions = [json.loads(obj) for obj in json_objects]
				except json.JSONDecodeError as json_error:
					self.logger.error(f"Error decoding JSON: {json_error}")

				if self.ball_position['x'] - self.ball_radius <= 0:
					self.score2 += 1
					self.ball_position = {'x': 400, 'y': 300}
					self.ball_speed_x = random.choice([-2.5, 2.5])
					self.ball_speed_y = random.choice([-2.5, 2.5])
					self.game_room.score2 += 1
					await sync_to_async(self.game_room.save)()
				elif self.ball_position['x'] + self.ball_radius >= 800:
					self.score1 += 1
					self.ball_position = {'x': 400, 'y': 300}
					self.ball_speed_x = random.choice([-2.5, 2.5])
					self.ball_speed_y = random.choice([-2.5, 2.5])
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
					self.logger.error(f'collision')
					self.ball_speed_x *= -1

				if self.ball_position['y'] - self.ball_radius <= 0 or self.ball_position['y'] + self.ball_radius >= 600:
					self.logger.error(f'collision')
					self.ball_speed_y *= -1

				if (
					paddle1_positions[0] - 20 <= self.ball_position['x'] <= paddle1_positions[0] + 20 and
					paddle1_positions[1] - 50 - self.ball_radius <= self.ball_position['y'] <= paddle1_positions[1] + 50
					):
					self.relative_intersect_y = self.ball_position['y'] - paddle1_positions[1]
					self.normalized_relative_intersect_y = self.relative_intersect_y / 50
					self.bounce_angle = self.normalized_relative_intersect_y * self.max_bounce_angle
					self.ball_speed_x *= -1
					self.ball_speed_y = math.sin(self.bounce_angle) * 2
				if (
					paddle2_positions[0] - 20 <= self.ball_position['x'] <= paddle2_positions[0] + 20 and
					paddle2_positions[1] - 50 - self.ball_radius <= self.ball_position['y'] <= paddle2_positions[1] + 50
					):
					self.relative_intersect_y = self.ball_position['y'] - paddle2_positions[1]
					self.normalized_relative_intersect_y = self.relative_intersect_y / 50
					self.bounce_angle = self.normalized_relative_intersect_y * self.max_bounce_angle
					self.ball_speed_x *= -1
					self.ball_speed_y = math.sin(self.bounce_angle) * 2

				await self.ball_update({'ball_position': self.ball_position})
				await asyncio.sleep(1 / 120)
		except Exception as e:
			self.logger.error(f"An error occurred while running the game loop: {e}")


	async def connect(self):
		self.room_name = self.scope['url_route']['kwargs']['room_name']
		self.room_group_name = 'game_%s' % self.room_name
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
			self.game_room = await self.get_game_room()	
			self.logger.debug('start_game')
			self.ball_position = {'x': 400, 'y': 300}
			self.paddle1_position = {'x': 10, 'y': 300}
			self.paddle2_position = {'x': 790, 'y': 300}
			self.max_bounce_angle = math.pi / 2
			asyncio.create_task(self.game_loop())
			self.users = await sync_to_async(lambda: [player.user for player in self.game_room.roomplayer_set.all()])()
			self.user1 = self.users[0]
			if len(self.users) > 1:
				self.user2 = self.users[1]
			else:
				self.user2 = self.user1
			await self.channel_layer.group_send(
				self.room_group_name,
				{
					'type': 'game_message',
					'message': 'start_game',
					'user1': self.user1.login,
					'user2': self.user2.login
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
			'score2': event['score2'] if 'score2' in event else '',
			'user1': event['user1'] if 'user1' in event else '',
			'user2': event['user2'] if 'user2' in event else ''
		}))
