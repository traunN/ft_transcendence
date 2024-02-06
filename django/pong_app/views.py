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
from django.conf import settings as django_settings
from .models import GameRoom, User, RoomPlayer, Tournament, TournamentPlayer, GameHistory, ChatMessage
import logging
import json
from django.db.models import Count
import random
import time
import string
import pdb;
from django.http import HttpResponse
import requests
from django.contrib.auth.hashers import make_password
from django.contrib.auth.hashers import check_password
import urllib.request
from django.core.files.base import ContentFile
import os
from django.http import HttpResponseForbidden
from django.core.files import File
from django.core.files.temp import NamedTemporaryFile
from django.core.files.storage import default_storage
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework_simplejwt.tokens import TokenError
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated

def accept(request, user_id):
	if request.method == 'POST':
		try:
			data = json.loads(request.body.decode('utf-8'))
			from_user = User.objects.get(idName=data['from_user'])
			to_user = User.objects.get(idName=data['to_user'])
			if to_user not in from_user.invitedUsers.all():
				return JsonResponse({'status': 'error', 'message': 'User not invited'})
			from_user.invitedUsers.remove(to_user)
			from_user.save()
			to_user.save()
			return JsonResponse({'status': 'success', 'message': 'Invitation accepted successfully'})
		except Exception as e:
			return JsonResponse({'status': 'error', 'message': str(e)})
	else:
		return JsonResponse({'status': 'error', 'message': 'Invalid request method'})

def invite(request, user_id):
	if request.method == 'POST':
		try:
			data = json.loads(request.body.decode('utf-8'))
			from_user = User.objects.get(idName=data['from_user'])
			to_user = User.objects.get(idName=data['to_user'])
			# if already invited, return error
			if to_user in from_user.invitedUsers.all():
				return JsonResponse({'status': 'error', 'message': 'User already invited'})
			from_user.invitedUsers.add(to_user)
			from_user.save()
			to_user.save()
			return JsonResponse({'status': 'success', 'message': 'User successfully invited'})
		except Exception as e:
			return JsonResponse({'status': 'error', 'message': str(e)})
	else:
		return JsonResponse({'status': 'error', 'message': 'Invalid request method'})

def check_blocked(request, user_id):
	if request.method == 'POST':
		try:
			data = json.loads(request.body.decode('utf-8'))
			from_user = User.objects.get(idName=data['from_user'])
			to_user = User.objects.get(idName=data['to_user'])
			if to_user in from_user.blockedUsers.all():
				return JsonResponse({'status': 'success', 'isBlocked': True})
			else:
				return JsonResponse({'status': 'success', 'isBlocked': False})
		except Exception as e:
			return JsonResponse({'status': 'error', 'message': str(e)})
	else:
		return JsonResponse({'status': 'error', 'message': 'Invalid request method'})

def unblock(request, user_id):
	if request.method == 'POST':
		try:
			data = json.loads(request.body.decode('utf-8'))
			from_user = User.objects.get(idName=data['from_user'])
			to_user = User.objects.get(idName=data['to_user'])
			from_user.blockedUsers.remove(to_user)
			from_user.save()
			to_user.save()
			return JsonResponse({'status': 'success', 'message': 'User successfully unblocked'})
		except Exception as e:
			return JsonResponse({'status': 'error', 'message': str(e)})
	else:
		return JsonResponse({'status': 'error', 'message': 'Invalid request method'})

def block(request, user_id):
	if request.method == 'POST':
		try:
			data = json.loads(request.body.decode('utf-8'))
			from_user = User.objects.get(idName=data['from_user'])
			to_user = User.objects.get(idName=data['to_user'])
			from_user.blockedUsers.add(to_user)
			from_user.save()
			to_user.save()
			return JsonResponse({'status': 'success', 'message': 'User successfully blocked'})
		except Exception as e:
			return JsonResponse({'status': 'error', 'message': str(e)})
	else:
		return JsonResponse({'status': 'error', 'message': 'Invalid request method'})

def send_message(request):
	if request.method == 'POST':
		try:
			data = json.loads(request.body.decode('utf-8'))
			user_id = data['user_id']
			message = data['message']
			user = User.objects.get(idName=user_id)
			username = f"{user.login}({user.idName})"
			message = ChatMessage.objects.create(user=user, username=username, message=message, idName=user.idName)
			message.save()
			return JsonResponse({'status': 'success', 'message': 'Message sent successfully'})
		except Exception as e:
			return JsonResponse({'status': 'error', 'message': str(e)})

def is_user_online(request, user_id):
	try:
		user = User.objects.get(idName=user_id)
		return JsonResponse({'status': 'success', 'isOnline': user.isOnline})
	except Exception as e:
		return JsonResponse({'status': 'error', 'message': str(e)})

def get_friends(request, user_id):
	try:
		user = User.objects.get(idName=user_id)
		friends = user.friendList.values('idName', 'login', 'image')
		return JsonResponse({'friends': list(friends)})
	except User.DoesNotExist:
		return JsonResponse({'error': 'User not found'}, status=404)

def accept_friend_request(request):
	if request.method == 'POST':
		try:
			data = json.loads(request.body.decode('utf-8'))
			from_user = User.objects.get(idName=data['from_user'])
			to_user = User.objects.get(idName=data['to_user'])
			from_user.friendList.add(to_user)
			to_user.friendList.add(from_user)
			from_user.save()
			to_user.save()
			return JsonResponse({'status': 'success', 'message': 'Friend request accepted successfully'})
		except Exception as e:
			return JsonResponse({'status': 'error', 'message': str(e)})
	else:
		return JsonResponse({'status': 'error', 'message': 'Invalid request method'})

def proxy_view(request):
	auth_header = request.headers.get('Authorization')
	if not auth_header or not auth_header.startswith('Bearer '):
		return JsonResponse({'status': 'error', 'message': 'Missing or invalid Authorization header'})

	access_token = auth_header.split(' ')[1]

	# Include the access token in the 'Authorization' header when making the request to the API
	headers = {'Authorization': 'Bearer ' + access_token}
	response = requests.get('https://api.intra.42.fr/v2/me', headers=headers)
	if response.status_code == 200 and response.text.strip():
		try:
			data = response.json()
			return JsonResponse(data, safe=False)
		except json.JSONDecodeError:
			return HttpResponse("Invalid JSON response", status=500)
	else:
		print("Empty response or server error")
		return HttpResponse("Empty response or server error", status=500)


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

@api_view(['POST'])
def update_user(request):
	if request.method == 'POST':
		try:
			user_id = request.POST['id']
			try:
				user = User.objects.get(idName=user_id)
			except User.DoesNotExist:
				return JsonResponse({'status': 'error', 'message': 'User does not exist'})
			authorization_head = request.headers.get('Authorization')
			if not authorization_head or not authorization_head.startswith('Bearer '):
				return JsonResponse({'status': 'error', 'message': 'Missing or invalid Authorization header'})
			access_token = authorization_head.split(' ')[1]
			jwt_authentication = JWTAuthentication()
			decoded_token = jwt_authentication.get_validated_token(access_token)
			token_user_id = decoded_token['user_id']
			if token_user_id != user_id:
				return JsonResponse({'status': 'error', 'message': 'User not authorized to update this user'})
			user.login = request.POST['login']
			user.email = request.POST['email']
			user.firstName = request.POST['firstName']
			user.lastName = request.POST['lastName']
			user.campus = request.POST['campus']
			if 'image' in request.FILES:
				image = request.FILES['image']
				image_name = image.name
				image_path = os.path.join(django_settings.MEDIA_ROOT, 'images', image_name)
				with open(image_path, 'wb+') as destination:
					for chunk in image.chunks():
						destination.write(chunk)
				user.image = image_name
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

@api_view(['GET'])
def join_or_create_room(request, user_id):
	try:
		user = User.objects.get(idName=user_id)
		if user is None:
			return JsonResponse({'status': 'error', 'message': 'User not found'})
		authorization_head = request.headers.get('Authorization')
		if not authorization_head or not authorization_head.startswith('Bearer '):
			return JsonResponse({'status': 'error', 'message': 'Missing or invalid Authorization header'})
		access_token = authorization_head.split(' ')[1]
		jwt_authentication = JWTAuthentication()
		decoded_token = jwt_authentication.get_validated_token(access_token)
		token_user_id = decoded_token['user_id']
		if token_user_id != user_id:
			return JsonResponse({'status': 'error', 'message': 'User not authorized to update this user'})
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

@api_view(['POST'])
def cancel_room(request, user_id):
	try:
		user = User.objects.get(idName=user_id)
		if user is None:
			return JsonResponse({'status': 'error', 'message': 'User not found'})
		authorization_head = request.headers.get('Authorization')
		if not authorization_head or not authorization_head.startswith('Bearer '):
			return JsonResponse({'status': 'error', 'message': 'Missing or invalid Authorization header'})
		access_token = authorization_head.split(' ')[1]
		jwt_authentication = JWTAuthentication()
		decoded_token = jwt_authentication.get_validated_token(access_token)
		token_user_id = decoded_token['user_id']
		if token_user_id != user_id:
			return JsonResponse({'status': 'error', 'message': 'User not authorized to update this user'})
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

def privateGame(request, room_name):
	return render(request, 'privateGame.html', {'room_name': room_name})

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

def view_profile(request, user_id):
	user = User.objects.get(idName=user_id)
	return render(request, 'profile.html', {'user': user})

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
			user_dict = model_to_dict(user, fields=[
			'login', 'isFrom42', 'password', 'email', 'firstName', 'lastName', 
			'campus', 'level', 'wallet', 'correctionPoint', 'location', 'idName', 
			'image', 'wins', 'loses', 'elo', 'alias', 'tournamentWins', 'isOnline'
			])
			user_dict['image'] = 'https://localhost:8443/media/images/' + str(user.image)
			refresh = RefreshToken.for_user(user)
			refresh['user_id'] = str(user.idName)
			access_token = str(refresh.access_token)
			refresh_token = str(refresh)
			return JsonResponse({'user': user_dict, 'access_token': access_token, 'refresh_token': refresh_token})
		else:
			return JsonResponse({'status': 'error', 'message': 'Invalid password'})
	except User.DoesNotExist:
		return JsonResponse({'status': 'error', 'message': 'User does not exist'})
	except Exception as e:
		return JsonResponse({'status': 'error', 'message': str(e)})

def save_user_profile_42(request):
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
			user_dict = model_to_dict(user, fields=[
				'login', 'isFrom42', 'password', 'email', 'firstName', 'lastName', 
				'campus', 'level', 'wallet', 'correctionPoint', 'location', 'idName', 
				'image', 'wins', 'loses', 'elo', 'alias', 'tournamentWins', 'isOnline'
			])
			user_dict['image'] = str(user.image)
			user.id = user.idName
			refresh = RefreshToken.for_user(user)
			access_token = str(refresh.access_token)
			refresh_token = str(refresh)
			return JsonResponse({'user': user_dict, 'access_token': access_token, 'refresh_token': refresh_token})
		except User.DoesNotExist:
			user = User.objects.create(
				login=data['login'],
				isFrom42=True,
				password= '',
				email=data['email'],
				firstName='',
				lastName='',
				campus='',
				level=0,
				wallet=0,
				correctionPoint=0,
				location='',
				idName=data['idName'],
			)
			image_url = data['image']
			image_name = image_url.split('/')[-1] # get the image name from the URL
			image_path = os.path.join(django_settings.MEDIA_ROOT, 'images', image_name)
			with open(image_path, 'wb+') as destination:
				destination.write(urllib.request.urlopen(image_url).read())
			user.image = image_name
			user.save()
			user_dict = model_to_dict(user, fields=[
				'login', 'isFrom42', 'password', 'email', 'firstName', 'lastName', 
				'campus', 'level', 'wallet', 'correctionPoint', 'location', 'idName', 
				'image', 'wins', 'loses', 'elo', 'alias', 'tournamentWins', 'isOnline'
			])
			user_dict['image'] = 'https://localhost:8443/media/images/' + str(user.image)
			user_json = json.dumps(user_dict)
			# make sur user_id is used for access token
			user.id = user.idName
			refresh = RefreshToken.for_user(user)
			refresh['user_id'] = str(user.idName)
			access_token = str(refresh.access_token)
			refresh_token = str(refresh)
			response_data = {
				'user': user_dict,
				'access_token': access_token,
				'refresh_token': refresh_token,
			}
			return JsonResponse(response_data, status=200)
	else:
		return JsonResponse({'error': 'Invalid request'}, status=400)

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
			user_dict = model_to_dict(user, fields=[
				'login', 'isFrom42', 'password', 'email', 'firstName', 'lastName', 
				'campus', 'level', 'wallet', 'correctionPoint', 'location', 'idName', 
				'image', 'wins', 'loses', 'elo', 'alias', 'tournamentWins', 'isOnline'
			])
			user_dict['image'] = 'https://localhost:8443/media/images/' + str(user.image)
			refresh = RefreshToken.for_user(user)
			refresh['user_id'] = str(user.idName)
			access_token = str(refresh.access_token)
			refresh_token = str(refresh)
			response_data = {
				'user': user_dict,
				'access_token': access_token,
				'refresh_token': refresh_token,
			}
			return JsonResponse(response_data, status=200)
	else:
		return JsonResponse({'error': 'Invalid request'}, status=400)

def save_image_from_url(image_url, user):
	logger = logging.getLogger(__name__)
	response = requests.get(image_url)
	if response.status_code == 200:
		logger.error('Image downloaded from URL: ' + image_url)
		image_name = image_url.split('/')[-1] # get the image name from the URL
		image_path = os.path.join(dj_settings.MEDIA_ROOT, image_name)
		with open(image_path, 'wb') as image_file:
			image_file.write(response.content)
		return image_path
	else:
		logger.error('Failed to download image from URL: ' + image_url)
		return None

def get_user(request, user_id):
	try:
		user = User.objects.get(idName=user_id)
		user_dict = model_to_dict(user, fields=[
			'login', 'isFrom42', 'password', 'email', 'firstName', 'lastName', 
			'campus', 'level', 'wallet', 'correctionPoint', 'location', 'idName', 
			'image', 'wins', 'loses', 'elo', 'alias', 'tournamentWins', 'isOnline'
		])
		user_dict['image'] = 'https://localhost:8443/media/images/' + str(user.image)
		return JsonResponse({'user': user_dict}, safe=False)
	except User.DoesNotExist:
		return JsonResponse({'error': 'User not found'}, status=404)

def get_user_by_login(request, login):
	try:
		user = User.objects.get(login=login)
		user_dict = model_to_dict(user, fields=[
			'login', 'isFrom42', 'password', 'email', 'firstName', 'lastName', 
			'campus', 'level', 'wallet', 'correctionPoint', 'location', 'idName', 
			'image', 'wins', 'loses', 'elo', 'alias', 'tournamentWins', 'isOnline'
		])
		user_dict['image'] = 'https://localhost:8443/media/images/' + str(user.image)
		return JsonResponse({'user': user_dict}, safe=False)
	except User.DoesNotExist:
		return JsonResponse({'error': 'User not found'}, status=404)

def get_all_users(request):
	users = User.objects.all()
	users_dict = []
	for user in users:
		user_dict = model_to_dict(user, fields=[
			'login', 'isFrom42', 'password', 'email', 'firstName', 'lastName', 
			'campus', 'level', 'wallet', 'correctionPoint', 'location', 'idName', 
			'image', 'wins', 'loses', 'elo', 'alias', 'tournamentWins', 'isOnline'
		])
		user_dict['image'] = 'https://localhost:8443/media/images/' + str(user.image)
		users_dict.append(user_dict)
	return JsonResponse({'users': users_dict}, safe=False)
