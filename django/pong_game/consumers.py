import json
import asyncio
from channels.generic.websocket import AsyncWebsocketConsumer
import logging
from pong_app.models import GameRoom, GameHistory
from asgiref.sync import sync_to_async
from asgiref.sync import async_to_sync
from channels.db import database_sync_to_async
import math
import random

class GameConsumer(AsyncWebsocketConsumer):
	logger = logging.getLogger(__name__)
	ball_position = {'x': 0, 'y': 0}
	ball_speed_x = 3
	ball_speed_y = 3
	ball_radius = 10
	paddle1_position = {'x': 0, 'y': 0}
	paddle2_position = {'x': 0, 'y': 0}
	normalized_relative_intersect_y = 0
	bounce_angle = 4
	max_bounce_angle = 4
	game_room = None
	isGameRunning = True
	score1 = 0
	score2 = 0
	score_threshold = 3
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
			self.game_room = await sync_to_async(GameRoom.objects.get)(name=self.room_name)
			while self.isGameRunning:
				# self.logger.error("test")
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
					await database_sync_to_async(GameHistory.objects.create)(
						player1Id=self.user1.idName,
						player2Id=self.user2.idName,
						player1Login=self.user1.login,
						player2Login=self.user2.login,
						winnerId=(self.user1.idName if self.score1 >= self.score_threshold else self.user2.idName),
						score1=self.score1,
						score2=self.score2
					)
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
					self.ball_speed_x = random.choice([-3, 3])
					self.ball_speed_y = random.choice([-3, 3])
					self.game_room.score2 += 1
					await sync_to_async(self.game_room.save)()
				elif self.ball_position['x'] + self.ball_radius >= 800:
					self.score1 += 1
					self.ball_position = {'x': 400, 'y': 300}
					self.ball_speed_x = random.choice([-3, 3])
					self.ball_speed_y = random.choice([-3, 3])
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
					paddle1_positions[0] - 20 <= self.ball_position['x'] <= paddle1_positions[0] + 20 and
					paddle1_positions[1] - 50 - self.ball_radius <= self.ball_position['y'] <= paddle1_positions[1] + 50
					):
					self.relative_intersect_y = self.ball_position['y'] - paddle1_positions[1]
					self.normalized_relative_intersect_y = self.relative_intersect_y / 50
					self.bounce_angle = self.normalized_relative_intersect_y * self.max_bounce_angle
					self.ball_speed_x *= -1
					self.ball_speed_y = math.sin(self.bounce_angle) * 4
				if (
					paddle2_positions[0] - 20 <= self.ball_position['x'] <= paddle2_positions[0] + 20 and
					paddle2_positions[1] - 50 - self.ball_radius <= self.ball_position['y'] <= paddle2_positions[1] + 50
					):
					self.relative_intersect_y = self.ball_position['y'] - paddle2_positions[1]
					self.normalized_relative_intersect_y = self.relative_intersect_y / 50
					self.bounce_angle = self.normalized_relative_intersect_y * self.max_bounce_angle
					self.ball_speed_x *= -1
					self.ball_speed_y = math.sin(self.bounce_angle) * 4

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


	async def disconnect(self, close_code):
		# Leave room group
		await self.channel_layer.group_discard(
			self.room_group_name,	
			self.channel_name
		)
		self.isGameRunning = False

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
			self.ball_position = {'x': 400, 'y': 300}
			self.paddle1_position = {'x': 10, 'y': 300}
			self.paddle2_position = {'x': 790, 'y': 300}
			self.max_bounce_angle = math.pi / 2
			asyncio.create_task(self.game_loop())
			self.users = await sync_to_async(lambda: [player.user for player in self.game_room.roomplayer_set.all()])()
			self.user1 = self.users[0]
			self.user2 = self.users[1]
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

	async def game_message(self, event):
		message = event['message']
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

class TournamentConsumer(AsyncWebsocketConsumer):
	logger = logging.getLogger(__name__)
	async def tournament_updated(self, event):
		try:
			await self.send(text_data=json.dumps({
				'type': 'tournament_updated',
			}))
		except Exception as e:
			print(e)

	# Receive message from WebSocket
	async def receive(self, text_data):
		text_data_json = json.loads(text_data)
		if 'type' in text_data_json:
			if text_data_json['type'] == 'tournament_updated':
				await self.channel_layer.group_send(
					'tournament_page',
					{
						'type': 'tournament_updated',
					}
				)

	
	async def connect(self):
		await self.channel_layer.group_add(
			'tournament_page',
			self.channel_name
		)
		await self.accept()
	
	async def disconnect(self, close_code):
		await self.channel_layer.group_discard(
			'tournament_page',
			self.channel_name
		)

class FriendListConsumer(AsyncWebsocketConsumer):
	logger = logging.getLogger(__name__)

	def __init__(self, *args, **kwargs):
		super().__init__(*args, **kwargs)
		self.group_name = None

	async def friend_request(self, event):
		try:
			await self.send(text_data=json.dumps({
				'type': 'friend_request',
				'from_user': event['from_user'],
			}))
		except Exception as e:
			print(e)

	# Receive message from WebSocket
	async def receive(self, text_data):
		text_data_json = json.loads(text_data)
		if text_data_json['type'] == 'friend_request':
			if 'from_user' in text_data_json:
				await self.channel_layer.group_send(
					f"user_{text_data_json['to_user']}",
					{
						'type': 'friend_request',
						'from_user': text_data_json['from_user'],
					}
				)

	async def connect(self):
		# connect user and add to group of it's id passed in url
		self.user_id = self.scope['url_route']['kwargs']['user_id']
		self.group_name = f"user_{self.user_id}"
		self.logger.error(f"User {self.user_id} connected.")
		await self.channel_layer.group_add(
			self.group_name,
			self.channel_name
		)
		await self.accept()

	async def disconnect(self, close_code):
		if self.group_name is not None:
			await self.channel_layer.group_discard(
				self.group_name,
				self.channel_name
			)


class ChatConsumer(AsyncWebsocketConsumer):
	logger = logging.getLogger(__name__)
	async def chat_updated(self, event):
		try:
			await self.send(text_data=json.dumps({
				'type': 'chat_updated',
			}))
		except Exception as e:
			print(e)

	# Receive message from WebSocket
	async def receive(self, text_data):
		text_data_json = json.loads(text_data)
		if 'type' in text_data_json:
			if text_data_json['type'] == 'chat_updated':
				await self.channel_layer.group_send(
					'chat_page',
					{
						'type': 'chat_updated',
					}
				)

	async def connect(self):
		await self.channel_layer.group_add(
			'chat_page',
			self.channel_name
		)
		await self.accept()
	
	async def disconnect(self, close_code):
		await self.channel_layer.group_discard(
			'chat_page',
			self.channel_name
		)


class TournamentLobbyConsumer(AsyncWebsocketConsumer):
	logger = logging.getLogger(__name__)
	async def tournament_lobby_updated(self, event):
		try:
			await self.send(text_data=json.dumps({
				'type': 'tournament_lobby_updated',
			}))
		except Exception as e:
			print(e)

	async def tournament_lobby_game_started(self, event):
		try:
			await self.send(text_data=json.dumps({
				'type': 'tournament_lobby_game_started',
				'room_name1': event['room_name1'],
				'room_name2': event['room_name2'],
			}))
		except Exception as e:
			print(e)

	async def first_match_finished(self, event):
		try:
			await self.send(text_data=json.dumps({
				'type': 'first_match_finished',
				'winner_id': event['winner_id'],
			}))
		except Exception as e:
			print(e)

	async def second_match_finished(self, event):
		try:
			await self.send(text_data=json.dumps({
				'type': 'second_match_finished',
				'winner_id': event['winner_id'],
			}))
		except Exception as e:
			print(e)

	async def final_match_finished(self, event):
		try:
			await self.send(text_data=json.dumps({
				'type': 'final_match_finished',
				'winner_id': event['winner_id'],
			}))
		except Exception as e:
			print(e)

	async def canceled_room(self, event):
		try:
			await self.send(text_data=json.dumps({
				'type': 'canceled_room',
				'user_id': event['user_id'],
				'room_name': event['room_name'],
			}))
		except Exception as e:
			print(e)

	async def cancel_lobby(self, event):
		try:
			await self.send(text_data=json.dumps({
				'type': 'cancel_lobby',
			}))
		except Exception as e:
			print(e)

	async def next_players(self, event):
		try:
			await self.send(text_data=json.dumps({
				'type': 'next_players',
				'player1': event['player1'],
				'player2': event['player2'],
			}))
		except Exception as e:
			print(e)

	async def receive(self, text_data):
		text_data_json = json.loads(text_data)
		if 'type' in text_data_json and 'tournament_id' in text_data_json:
			if text_data_json['type'] == 'tournament_lobby_updated':
				await self.channel_layer.group_send(
					f'tournament_lobby_{text_data_json["tournament_id"]}',
					{
						'type': 'tournament_lobby_updated',
					}
				)
			elif text_data_json['type'] == 'tournament_lobby_game_started':
				await self.channel_layer.group_send(
					f'tournament_lobby_{text_data_json["tournament_id"]}',
					{
						'type': 'tournament_lobby_game_started',
						'room_name1': text_data_json['room_name1'],
						'room_name2': text_data_json['room_name2'],
					}
				)
			elif text_data_json['type'] == 'first_match_finished':
				# send next players with other two players
				self.logger.error("First match finished.")
				await self.channel_layer.group_send(
					f'tournament_lobby_{text_data_json["tournament_id"]}',
					{
						'type': 'first_match_finished',
						'winner_id': text_data_json['winner_id'],
					}
				)
			elif text_data_json['type'] == 'second_match_finished':
				self.logger.error("Second match finished.")
				await self.channel_layer.group_send(
					f'tournament_lobby_{text_data_json["tournament_id"]}',
					{
						'type': 'second_match_finished',
						'winner_id': text_data_json['winner_id'],
					}
				)
			elif text_data_json['type'] == 'final_match_finished':
				self.logger.error("Final match finished.")
				await self.channel_layer.group_send(
					f'tournament_lobby_{text_data_json["tournament_id"]}',
					{
						'type': 'final_match_finished',
						'winner_id': text_data_json['winner_id'],
					}
				)
			elif text_data_json['type'] == 'canceled_room':
				self.logger.error("Canceled room.")
				await self.channel_layer.group_send(
					f'tournament_lobby_{text_data_json["tournament_id"]}',
					{
						'type': 'canceled_room',
						'user_id': text_data_json['user_id'],
						'room_name': text_data_json['room_name'],
					}
				)
			elif text_data_json['type'] == 'cancel_lobby':
				self.logger.error("Canceled lobby.")
				await self.channel_layer.group_send(
					f'tournament_lobby_{text_data_json["tournament_id"]}',
					{
						'type': 'cancel_lobby',
					}
				)
			elif text_data_json['type'] == 'next_players':
				self.logger.error("Next players.")
				await self.channel_layer.group_send(
					f'tournament_lobby_{text_data_json["tournament_id"]}',
					{
						'type': 'next_players',
						'player1': text_data_json['player1'],
						'player2': text_data_json['player2'],
					}
				)
		else:
			self.logger.error("Invalid message received. 'type' or 'tournament_id' missing.")

	async def connect(self):
		self.tournament_id = self.scope['url_route']['kwargs']['tournament_id']
		await self.channel_layer.group_add(
			f'tournament_lobby_{self.tournament_id}',
			self.channel_name
		)
		await self.accept()
	
	async def disconnect(self, close_code):
		await self.channel_layer.group_discard(
			f'tournament_lobby_{self.tournament_id}',
			self.channel_name
		)
		
class TournamentGameConsumer(AsyncWebsocketConsumer):
	logger = logging.getLogger(__name__)
	game_room = None
	ball_position = {'x': 0, 'y': 0}
	ball_speed_x = 3
	ball_speed_y = 3
	ball_radius = 10
	paddle1_position = {'x': 0, 'y': 0}
	paddle2_position = {'x': 0, 'y': 0}
	normalized_relative_intersect_y = 0
	bounce_angle = 4
	max_bounce_angle = 4
	isGameRunning = True
	score1 = 0
	score2 = 0
	score_threshold = 3
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
			self.logger.error("Game loop started.")
			while self.isGameRunning:
				self.game_room = await sync_to_async(GameRoom.objects.get)(name=self.room_name)
				if self.score1 >= self.score_threshold or self.score2 >= self.score_threshold:
					self.game_over = True
					self.gameState = 'waiting'
					await sync_to_async(self.user1.save)()
					await sync_to_async(self.user2.save)()
					await sync_to_async(self.game_room.save)()
					await self.channel_layer.group_send(
						self.room_group_name,
						{
							'type': 'game_message',
							'message': 'game_over',
							'score1': self.score1,
							'score2': self.score2,
							'winner': self.user1.idName if self.score1 >= self.score_threshold else self.user2.idName,
							'loser': self.user2.idName if self.score1 >= self.score_threshold else self.user1.idName
						}
					)
					self.isGameRunning = False
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
					self.ball_speed_x = random.choice([-3, 3])
					self.ball_speed_y = random.choice([-3, 3])
					self.game_room.score2 += 1
					await sync_to_async(self.game_room.save)()
				elif self.ball_position['x'] + self.ball_radius >= 800:
					self.score1 += 1
					self.ball_position = {'x': 400, 'y': 300}
					self.ball_speed_x = random.choice([-3, 3])
					self.ball_speed_y = random.choice([-3, 3])
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
					paddle1_positions[0] - 20 <= self.ball_position['x'] <= paddle1_positions[0] + 20 and
					paddle1_positions[1] - 50 - self.ball_radius <= self.ball_position['y'] <= paddle1_positions[1] + 50
					):
					self.relative_intersect_y = self.ball_position['y'] - paddle1_positions[1]
					self.normalized_relative_intersect_y = self.relative_intersect_y / 50
					self.bounce_angle = self.normalized_relative_intersect_y * self.max_bounce_angle
					self.ball_speed_x *= -1
					self.ball_speed_y = math.sin(self.bounce_angle) * 4
				if (
					paddle2_positions[0] - 20 <= self.ball_position['x'] <= paddle2_positions[0] + 20 and
					paddle2_positions[1] - 50 - self.ball_radius <= self.ball_position['y'] <= paddle2_positions[1] + 50
					):
					self.relative_intersect_y = self.ball_position['y'] - paddle2_positions[1]
					self.normalized_relative_intersect_y = self.relative_intersect_y / 50
					self.bounce_angle = self.normalized_relative_intersect_y * self.max_bounce_angle
					self.ball_speed_x *= -1
					self.ball_speed_y = math.sin(self.bounce_angle) * 4

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
		

	async def disconnect(self, close_code):
		await self.channel_layer.group_discard(
			self.room_group_name,	
			self.channel_name
		)
		self.isGameRunning = False

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
			self.ball_position = {'x': 400, 'y': 300}
			self.paddle1_position = {'x': 10, 'y': 300}
			self.paddle2_position = {'x': 790, 'y': 300}
			self.max_bounce_angle = math.pi / 2
			asyncio.create_task(self.game_loop())
			self.users = await sync_to_async(lambda: [player.user for player in self.game_room.roomplayer_set.all()])()
			self.user1 = self.users[0]
			self.user2 = self.users[1]
			await self.channel_layer.group_send(
				self.room_group_name,
				{
					'type': 'game_message',
					'message': 'start_game',
					'user1': self.user1.alias,
					'user2': self.user2.alias
				}
			)
		elif message == 'user_left':
			user_id = text_data_json['user_id']
			self.game_over = True
			self.gameState = 'waiting'
			await sync_to_async(self.user1.save)()
			await sync_to_async(self.user2.save)()
			await sync_to_async(self.game_room.save)()
			await self.channel_layer.group_send(
				self.room_group_name,
				{
					'type': 'game_message',
					'message': 'game_over',
					'score1': self.score1,
					'score2': self.score2,
					'winner': self.user1.idName if self.user1.id == user_id else self.user2.idName,
					'loser': self.user2.idName if self.user1.id == user_id else self.user1.idName
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
	
	async def game_message(self, event):
		message = event['message']
		await self.send(text_data=json.dumps({
			'message': message,
			'ball_position': event['ball_position'] if 'ball_position' in event else '',
			'paddle1_position': event['paddle1_position'] if 'paddle1_position' in event else '',
			'paddle2_position': event['paddle2_position'] if 'paddle2_position' in event else '',
			'game_over': self.game_over,
			'score1': event['score1'] if 'score1' in event else '',
			'score2': event['score2'] if 'score2' in event else '',
			'user1': event['user1'] if 'user1' in event else '',
			'user2': event['user2'] if 'user2' in event else '',
			'winner': event['winner'] if 'winner' in event else '',
			'loser': event['loser'] if 'loser' in event else ''
		}))