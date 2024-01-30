from django.shortcuts import render
from django.views import View
from django.db import connection
from django.views.decorators.csrf import csrf_exempt
from pong_app.models import User
from django.http import JsonResponse
from django.forms.models import model_to_dict
from django.db.models import Q
from django.views import generic
from django.conf import settings
from .models import GameRoom, User, RoomPlayer, Tournament, TournamentPlayer, GameHistory
import logging
import json
from django.db.models import Count
import random
import string
import faker
import pdb;
from django.http import HttpResponse
import requests
from django.contrib.auth.hashers import make_password
from django.contrib.auth.hashers import check_password
import urllib.request
from django.core.files.base import ContentFile
import os

def set_user_online(request, user_id):
	try:
		user = User.objects.get(idName=user_id)
		user.isOnline = True
		user.save()
		return JsonResponse({'status': 'success', 'message': 'User set online successfully'})
	except Exception as e:
		return JsonResponse({'status': 'error', 'message': str(e)})

def set_user_offline(request, user_id):
	try:
		user = User.objects.get(idName=user_id)
		user.isOnline = False
		user.save()
		return JsonResponse({'status': 'success', 'message': 'User set offline successfully'})
	except Exception as e:
		return JsonResponse({'status': 'error', 'message': str(e)})

def get_user_game_history(request, user_id):
	try:
		user = User.objects.get(idName=user_id)
		games = GameHistory.objects.filter(Q(player1Id=user_id) | Q(player2Id=user_id)).order_by('-game_date')
		# if no games found, return empty list
		if not games.exists():
			return JsonResponse({'games': []})
		for game in games:
			# get user with player1Id and player2Id and update player1Login and player2Login
			player1 = User.objects.get(idName=game.player1Id)
			player2 = User.objects.get(idName=game.player2Id)
			game.player1Login = player1.login
			game.player2Login = player2.login
			game.save()
		games = games.values()
		return JsonResponse({'games': list(games.values())})
	except User.DoesNotExist:
		return JsonResponse({'error': 'User not found'}, status=404)


def record_game(request):
	player1_id = request.POST['player1Id']
	player2_id = request.POST['player2Id']
	player1_login = request.POST['player1Login']
	player2_login = request.POST['player2Login']
	winner_id = request.POST['winnerId']
	score1 = request.POST['score1']
	score2 = request.POST['score2']

	GameHistory.objects.create(
		player1_id=player1_id,
		player2_id=player2_id,
		player1_login=player1_login,
		player2_login=player2_login,
		winner_id=winner_id,
		score1=score1,
		score2=score2,
	)
	return JsonResponse({"status": "success"})

def update_user(request):
	if request.method == 'POST':
		try:
			user_id = request.POST['id']
			try:
				user = User.objects.get(idName=user_id)
			except User.DoesNotExist:
				return JsonResponse({'status': 'error', 'message': 'User does not exist'})
			user.login = request.POST['login']
			user.email = request.POST['email']
			user.firstName = request.POST['firstName']
			user.lastName = request.POST['lastName']
			user.campus = request.POST['campus']
			if 'image' in request.FILES:
				user.image = request.FILES['image']
			user.save()
			return JsonResponse({'status': 'success', 'message': 'User updated successfully'})
		except Exception as e:
			return JsonResponse({'status': 'error', 'message': str(e)})
	else:
		return JsonResponse({'status': 'error', 'message': 'Invalid request method'})

def exchange_token(request):
	try:
		# Get the authorization code from the request
		code = request.GET.get('code')

		# Define the redirect URI and the data for the POST request
		redirect_uri = 'https://localhost:8443/homePage/'
		post_data = {
			'grant_type': 'authorization_code',
			'client_id': 'u-s4t2ud-7c5080717dbb44d8ad2439acf51e0d576db8aaf6f49ef1866fc422e96ca86dd2',
			'client_secret': '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',
			'code': code,
			'redirect_uri': redirect_uri
		}

		# Make the POST request to exchange the code for a token
		response = requests.post('https://api.intra.42.fr/oauth/token', data=post_data)

		# Check if the request was successful
		if response.status_code == 200:
			# Return the access token to the frontend
			response_data = response.json()
			access_token = response_data['access_token']
			return JsonResponse({'access_token': access_token})
		else:
			return JsonResponse({'status': 'error', 'message': 'Token exchange failed'})
	except Exception as e:
		return JsonResponse({'status': 'error', 'message': str(e)})

def get_client_secret(request):
	try:
		return JsonResponse({'status': 'success', 'client_secret': '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'})
	except Exception as e:
		return JsonResponse({'status': 'error', 'message': str(e)})

def get_client_id(request):
	try:
		return JsonResponse({'status': 'success', 'client_id': 'u-s4t2ud-7c5080717dbb44d8ad2439acf51e0d576db8aaf6f49ef1866fc422e96ca86dd2'})
	except Exception as e:
		return JsonResponse({'status': 'error', 'message': str(e)})

def user_win_tournament(request, user_id):
	try:
		user = User.objects.get(idName=user_id)
		user.tournamentWins += 1
		user.save()
		return JsonResponse({'status': 'success', 'message': 'User win tournament successfully'})
	except Exception as e:
		return JsonResponse({'status': 'error', 'message': str(e)})

def get_tournament_status(request, tournament_id):
	try:
		tournament = Tournament.objects.get(id=tournament_id)
		return JsonResponse({'status': 'success', 'tournament_status': tournament.status})
	except Tournament.DoesNotExist:
		return JsonResponse({'status': 'error', 'message': 'Tournament not found'})

def change_tournament_status(request, tournament_id):
	if request.method == 'POST':
		try:
			data = json.loads(request.body.decode('utf-8'))
			tournament = Tournament.objects.get(id=tournament_id)
			tournament.status = data['status']
			tournament.save()
			return JsonResponse({'status': 'success', 'message': 'Changed tournament status successfully'})
		except Exception as e:
			return JsonResponse({'status': 'error', 'message': str(e)})
	else:
		return JsonResponse({'status': 'error', 'message': 'Invalid request method'})

def create_tournament_game(request, tournament_id, room_name, user_id):
	try:
		tournament = Tournament.objects.get(id=tournament_id)
		if GameRoom.objects.filter(name=room_name).exists():
			room = GameRoom.objects.get(name=room_name)
		else:
			room = GameRoom(name=room_name)
			room.gameState = 'waiting_tournament'
			room.save()
		user = User.objects.get(idName=user_id)
		room.ball_position = '0,0'
		room.paddle1_position = '0,0'
		room.paddle2_position = '0,0'
		room_player, created = RoomPlayer.objects.get_or_create(user=user, room=room)
		room_player.save()

		room.player_count += 1
		room.save()

		if room.player_count == 2:
			room.gameState = 'playing_tournament'
			room.save()
			return JsonResponse({'status': 'success', 'start_game': True, 'room_name': room.name})
		else: 
			return JsonResponse({'status': 'success', 'start_game': False, 'room_name': room.name})
	except Exception as e:
		return JsonResponse({'status': 'error', 'message': str(e)})

def set_player_ready(request):
	if request.method == 'POST':
		try:
			data = json.loads(request.body.decode('utf-8'))
			user = User.objects.get(idName=data['user_id'])
			tournament = Tournament.objects.get(id=data['tournament_id'])
			player = TournamentPlayer.objects.get(user=user, tournament=tournament)
			if user.alias != '':
				player.is_ready = True
			if user.alias == '':
				player.is_ready = False
			player.save()
			return JsonResponse({'status': 'success', 'message': 'Player set as ready successfully'})
		except Exception as e:
			return JsonResponse({'status': 'error', 'message': str(e)})
	else:
		return JsonResponse({'status': 'error', 'message': 'Invalid request method'})


def change_tournament_user_alias(request, user_id):
	if request.method == 'POST':
		try:
			data = json.loads(request.body.decode('utf-8'))
			user = User.objects.get(idName=user_id)
			user.alias = data['alias']
			user.save()
			return JsonResponse({'status': 'success', 'message': 'Changed tournament user alias successfully'})
		except Exception as e:
			return JsonResponse({'status': 'error', 'message': str(e)})
	else:
		return JsonResponse({'status': 'error', 'message': 'Invalid request method'})

def get_players_in_tournament(request, tournament_id):
	tournament = Tournament.objects.get(id=tournament_id)
	players = TournamentPlayer.objects.filter(tournament=tournament)
	player_data = []
	for player in players:
		player_data.append({
			'id': player.user.id,
			'login': player.user.login,
			'idName': player.user.idName,
			'alias': player.user.alias,
			'is_ready': player.is_ready
		})
	player_data.sort(key=lambda x: x['id'])
	return JsonResponse({'players': player_data})

def leave_tournament(request, user_id):
	if request.method == 'POST':
		try:
			data = json.loads(request.body.decode('utf-8'))
			tournament_id = data['tournament_id']
			user = User.objects.get(idName=user_id)
			user.alias = ''
			user.save()
			tournament = Tournament.objects.get(id=tournament_id)
			tournament_player = TournamentPlayer.objects.get(user=user, tournament=tournament)
			tournament_player.count -= 1
			tournament.count -= 1
			tournament_player.save()
			tournament.save()
			if tournament_player.count == 0:
				tournament_player.delete()
			if tournament.count == 0:
				tournament.delete()
			return JsonResponse({'status': 'success', 'message': 'Left tournament successfully'})
		except Exception as e:
			return JsonResponse({'status': 'error', 'message': str(e)})
	else:
		return JsonResponse({'status': 'error', 'message': 'Invalid request method'})

def available_tournaments(request):
	tournaments = Tournament.objects.filter(status='available').annotate(player_count=Count('players'))
	tournaments_dict = []
	for tournament in tournaments:
		tournament_dict = model_to_dict(tournament)
		creator_id = tournament_dict.pop('creator')
		creator = User.objects.get(id=creator_id)
		tournament_dict['creator'] = model_to_dict(creator)
		tournament_dict['creator']['image'] = str(tournament_dict['creator']['image'])
		tournament_dict['players'] = [model_to_dict(player) for player in tournament.players.all()]
		for player in tournament_dict['players']:
			player['image'] = str(player['image'])
		tournament_dict['count'] = tournament.player_count
		tournaments_dict.append(tournament_dict)
	return JsonResponse({'tournaments': tournaments_dict}, safe=False)

def join_tournament(request, user_id):
	if request.method == 'POST':
		try:
			data = json.loads(request.body.decode('utf-8'))
			tournament_id = data['tournament_id']
			user = User.objects.get(idName=user_id)
			tournament = Tournament.objects.get(id=tournament_id)
			tournament_player = TournamentPlayer(user=user, tournament=tournament)
			tournament_player.count = 1
			tournament.count += 1
			tournament_player.save()
			tournament.save()
			return JsonResponse({'status': 'success', 'message': 'Joined tournament successfully', 'tournament_id': tournament.id})
		except Exception as e:
			return JsonResponse({'status': 'error', 'message': str(e)})
	else:
		return JsonResponse({'status': 'error', 'message': 'Invalid request method'})

def create_tournament(request):
	if request.method == 'POST':
		try:
			data = json.loads(request.body.decode('utf-8'))
			tournament_name = data['tournament_name']
			user = User.objects.get(idName=data['user_id'])
			tournament = Tournament(name=tournament_name, creator=user)
			tournament.status = 'available'
			tournament.count = 1
			tournament.save()
			tournament_player = TournamentPlayer(user=user, tournament=tournament)
			tournament_player.save()
			return JsonResponse({'status': 'success', 'message': 'Tournament created successfully', 'tournament_id': tournament.id})
		except Exception as e:
			return JsonResponse({'status': 'error', 'message': str(e)})
	else:
		return JsonResponse({'status': 'error', 'message': 'Invalid request method'})

def join_or_create_room(request, user_id):
	try:
		rooms = GameRoom.objects.filter(player_count__lt=2)
		rooms = rooms.exclude(gameState='cancelled')
		rooms = rooms.exclude(gameState='waiting_tournament')
		if not rooms.exists():
			name = str(user_id) + '_room'
			if GameRoom.objects.filter(name=name).exists():
				i = 1
				while GameRoom.objects.filter(name=name + str(i)).exists():
					i += 1
				name = name + str(i)
			room = GameRoom(name=name)
			room.gameState = 'waiting'
			room.save()
		else:
			room = rooms.first()
			
		user = User.objects.get(idName=user_id)
		room.ball_position = '0,0'
		room.paddle1_position = '0,0'
		room.paddle2_position = '0,0'
		room_player, created = RoomPlayer.objects.get_or_create(user=user, room=room)
		room_player.save()

		room.player_count += 1
		room.save()

		if room.player_count == 2:
			room.gameState = 'playing'
			room.save()
			return JsonResponse({'status': 'success', 'start_game': True, 'room_name': room.name})
		else: 
			return JsonResponse({'status': 'success', 'start_game': False, 'room_name': room.name})
	except Exception as e:
		return JsonResponse({'status': 'error', 'message': str(e)})

async def update_user_info(self, user_id, wins, loses, elo):
	try:
		user = User.objects.get(idName=user_id)
		user.wins = wins
		user.loses = loses
		user.elo = elo
		user.save()
	except Exception as e:
		print(e)

def broadcast_to_room(room_name, message):
	channel_layer = get_channel_layer()
	async_to_sync(channel_layer.group_send)(
		f'game_{room_name}',
		{
			'type': 'broadcast_message',
			'message': message,
		}
	)

def cancel_room(request, user_id):
	try:
		user = User.objects.get(idName=user_id)
		if user is None:
			return JsonResponse({'status': 'error', 'message': 'User not found'})
		room = GameRoom.objects.filter(players=user).first()
		if room is not None:
			room_player = RoomPlayer.objects.get(user=user, room=room)
			room_player.delete()
			room.gameState = 'cancelled'
			room.player_count -= 1
			room.save()

			# get RoomPlayer to check if there is another player in the room
			room_player = RoomPlayer.objects.filter(room=room).first()
			if room_player is not None:
				return JsonResponse({'status': 'success', 'message': 'Room cancelled successfully'})
			else:
				# if there is no other player in the room, delete the room
				room.delete()

			return JsonResponse({'status': 'success', 'message': 'Room cancelled successfully'})
		else:
			return JsonResponse({'status': 'error', 'message': 'No room found for the user'})
	except Exception as e:
		return JsonResponse({'status': 'error', 'message': str(e)})


def homePage(request):
	return render(request, 'homePage.html')

def login(request):
	return render(request, 'login.html')

def pongGame(request):
	return render(request, 'pongGame.html')

def leaderboard(request):
	return render(request, 'leaderboard.html')

def favicon(request):
	return render(request, 'favicon.ico')

def error(request):
	return render(request, 'error.html')

def profile(request, user_id=None):
	if user_id is None:
		user_id = request.user.id
	try:
		user = User.objects.get(idName=user_id)
		return render(request, 'profile.html', {'user': user})
	except User.DoesNotExist:
		return render(request, 'profile.html', {'user': None})


def settings(request):
	return render(request, 'settings.html')

def tournament(request):
	return render(request, 'tournament.html')

def tournament_lobby(request, tournament_id):
	try:
		tournament = Tournament.objects.get(id=tournament_id)
		return render(request, 'tournament_lobby.html', {'tournament': tournament})
	except Tournament.DoesNotExist:
		return render(request, 'tournament_lobby.html', {'tournament': None})

def tournament_game(request, tournament_id, room_name):
	try:
		tournament = Tournament.objects.get(id=tournament_id)
		return render(request, 'tournament_game.html', {'tournament': tournament, 'room_name': room_name})
	except Tournament.DoesNotExist:
		return render(request, 'tournament_game.html', {'tournament': None, 'room_name': room_name})

def createAccount(request):
	return render(request, 'createAccount.html')

def chat(request):
	return render(request, 'chat.html')

def testDBConnection(request):
	try:
		with connection.cursor() as cursor:
			cursor.execute("SELECT 1")
		connection.close()
		return render(request, 'success.html')
	except Exception as error:
		return render(request, 'error.html')

def login_user(request):
	try:
		data = json.loads(request.body.decode('utf-8'))
		accountName = data['accountName']
		password = data['password']
		user = User.objects.get(idName=accountName)
		if user.isFrom42:
			return JsonResponse({'status': 'error', 'message': 'User is from 42'})
		if check_password(password, user.password):
			user_dict = model_to_dict(user)
			user_dict['image'] ='https://' + request.get_host() + '/media/' + str(user.image)
			return JsonResponse({'status': 'success', 'user': user_dict})
		else:
			return JsonResponse({'status': 'error', 'message': 'Invalid password'})
	except User.DoesNotExist:
		return JsonResponse({'status': 'error', 'message': 'User does not exist'})
	except Exception as e:
		return JsonResponse({'status': 'error', 'message': str(e)})

def save_user_profile_manual(request):
	if request.method == 'POST':
		if not request.body:
			return JsonResponse({'error': 'Request body is empty'}, status=400)
		try:
			data = json.loads(request.body)
		except json.JSONDecodeError:
			return JsonResponse({'error': 'Invalid JSON in request body'}, status=400)
		user_id = data['accountName']
		try:
			user = User.objects.get(idName=user_id)
			return JsonResponse({'error': 'User already exists'}, status=200)
		except User.DoesNotExist:
			hashed_password = make_password(data['password'])
			user = User.objects.create(
				login=data['login'],
				isFrom42=False,
				password= hashed_password,
				email=data['email'],
				firstName='',
				lastName='',
				campus='',
				level=0,
				wallet=0,
				correctionPoint=0,
				location='',
				idName=data['accountName'],
				# setup image as default
				image='default.jpg'
			)
			user_dict = model_to_dict(user)
			user_dict['image'] = 'https://localhost:8443/media/images/' + str(user.image)
			user_json = json.dumps(user_dict)
			return HttpResponse(user_json, content_type='application/json')
	else:
		return JsonResponse({'error': 'Invalid request'}, status=400)

def save_image_from_url(url, user):
	with urllib.request.urlopen(url) as response:
		image_data = response.read()
		user.image.save(os.path.basename(url), ContentFile(image_data))

@csrf_exempt
def save_user_profile(request):
	if request.method == 'POST':
		if not request.body:
			return JsonResponse({'error': 'Request body is empty'}, status=400)
		try:
			data = json.loads(request.body)
		except json.JSONDecodeError:
			return JsonResponse({'error': 'Invalid JSON in request body'}, status=400)

		expected_keys = ['login', 'email', 'firstName', 'lastName','campus', 'level', 'wallet', 'correctionPoint', 'location', 'idName', 'image']
		if not all(key in data for key in expected_keys):
			return JsonResponse({'error': 'Missing data in request body'}, status=400)

		user_id = data['idName']
		try:
			user = User.objects.get(idName=user_id)
			return JsonResponse({'message': 'User already exists'}, status=200)
		except User.DoesNotExist:	
			user = User.objects.create(
				login=data['login'],
				isFrom42=True,
				password='',
				email=data['email'],
				firstName=data['firstName'],
				lastName=data['lastName'],
				campus=data['campus'],
				level=data['level'],
				wallet=data['wallet'],
				correctionPoint=data['correctionPoint'],
				location=data['location'],
				idName=data['idName'],
				# image=image_filename
			)
			image_url = data['image']
			save_image_from_url(image_url, user)
			return JsonResponse({'message': 'User profile saved successfully'}, status=200)
	else:
		return JsonResponse({'error': 'Invalid request'}, status=400)

def save_test_user(request):
	user_data = generate_random_user()

	try:
		user = User.objects.create(
			login=user_data['login'],
			isFrom42=True,
			password='',
			email=user_data['email'],
			firstName=user_data['firstName'],
			lastName=user_data['lastName'],
			campus=user_data['campus'],
			level=user_data['level'],
			wallet=user_data['wallet'],
			correctionPoint=user_data['correctionPoint'],
			location=user_data['location'],
			idName=user_data['idName'],
			image=user_data['image']
		)
	except Exception as e:
		import traceback
		return HttpResponse(str(e), status=500)


	user_dict = model_to_dict(user)
	user_dict['image'] = request.build_absolute_uri(user.image.url)
	user_json = json.dumps(user_dict)
	return HttpResponse(user_json, content_type='application/json')

def generate_random_user():
	fake = faker.Faker()
	login = ''.join(random.choices(string.ascii_lowercase + string.digits, k=10))
	email = fake.email()
	firstName = fake.first_name()
	lastName = fake.last_name()
	campus = random.choice(['Campus1', 'Campus2', 'Campus3'])
	level = random.randint(1, 10)
	wallet = round(random.uniform(10, 100), 2)
	correctionPoint = random.randint(0, 10)
	location = fake.city()
	idName = ''.join(random.choices(string.digits, k=10))
	image = 'https://cdn.intra.42.fr/users/5b610039b4ad44fb01cb2e6c530534f9/ntraun.jpg'
	return {
		'login': login,
		'email': email,
		'firstName': firstName,
		'lastName': lastName,
		'campus': campus,
		'level': level,
		'wallet': wallet,
		'correctionPoint': correctionPoint,
		'location': location,
		'idName': idName,
		'image': image
	}

def get_user(request, user_id):
	try:
		user = User.objects.get(idName=user_id)
		user_dict = model_to_dict(user)
		user_dict['image'] = 'https://localhost:8443/media/images/' + str(user.image)
		return JsonResponse({'user': user_dict}, safe=False)
	except User.DoesNotExist:
		return JsonResponse({'error': 'User not found'}, status=404)

def get_user_by_login(request, login):
	try:
		user = User.objects.get(login=login)
		user_dict = model_to_dict(user)
		user_dict['image'] = 'https://localhost:8443/media/images/' + str(user.image)
		return JsonResponse({'user': user_dict}, safe=False)
	except User.DoesNotExist:
		return JsonResponse({'error': 'User not found'}, status=404)

def get_all_users(request):
	users = User.objects.all()
	users_dict = [model_to_dict(user) for user in users]
	for user_dict in users_dict:
		user_dict['image'] = 'https://localhost:8443/media/images/' + str(user.image)
	return JsonResponse({'users': users_dict}, safe=False)