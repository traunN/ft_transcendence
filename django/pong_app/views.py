from django.shortcuts import render
from django.views import View
from django.db import connection
from django.views.decorators.csrf import csrf_exempt
from pong_app.models import User
from django.http import JsonResponse
from django.forms.models import model_to_dict
from django.db.models import Q
from django.views import generic
from .models import GameRoom, User, RoomPlayer, Tournament, TournamentPlayer
import logging
import json
from django.db.models import Count
import random
import string
import faker
from django.http import HttpResponse

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
	try:
		tournament = Tournament.objects.get(id=tournament_id)
		players = tournament.players.all()
		players_dict = [model_to_dict(player) for player in players]
		for player_dict in players_dict:
			player_dict['image'] = str(player_dict['image'])
		return JsonResponse({'players': players_dict}, safe=False)
	except Tournament.DoesNotExist:
		return JsonResponse({'status': 'error', 'message': 'Tournament not found'})

def leave_tournament(request, user_id):
	if request.method == 'POST':
		try:
			data = json.loads(request.body.decode('utf-8'))
			tournament_id = data['tournament_id']
			user = User.objects.get(idName=user_id)
			user.alias = ''
			user.save()
			tournament = Tournament.objects.get(id=tournament_id)
			#get first tournament player matching user and tournament
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
		if not rooms.exists():
			room = GameRoom(name=str(user_id) + '_room')
			room.save()
		else:
			room = rooms.first()

		user = User.objects.get(idName=user_id)
		room.ball_position = '0,0'
		room.paddle1_position = '0,0'
		room.paddle2_position = '0,0'
		room_player, created = RoomPlayer.objects.get_or_create(user=user, room=room)
		if created:
			room_player.count = 1
		else:
			room_player.count += 1
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
			if room_player.count > 1:
				room_player.count -= 1
				room_player.save()
			else:
				room_player.delete()
			room.player_count -= 1
			room.save()

			if room.player_count == 0:
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
				email=data['email'],
				firstName=data['firstName'],
				lastName=data['lastName'],
				campus=data['campus'],
				level=data['level'],
				wallet=data['wallet'],
				correctionPoint=data['correctionPoint'],
				location=data['location'],
				idName=data['idName'],
				image=data['image']
			)
			return JsonResponse({'message': 'User profile saved successfully'}, status=200)
	else:
		return JsonResponse({'error': 'Invalid request'}, status=400)

def save_test_user(request):
	user_data = generate_random_user()

	# Check if the user_data is valid
	logging.error('Saving user: ' + str(user_data))

	try:
		user = User.objects.create(
			login=user_data['login'],
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
		logging.error(traceback.format_exc())
		return HttpResponse(str(e), status=500)


	user_dict = model_to_dict(user)
	user_dict['image'] = str(user_dict['image'])
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
		user_dict['image'] = str(user_dict['image'])
		return JsonResponse({'user': user_dict}, safe=False)
	except User.DoesNotExist:
		return JsonResponse({'error': 'User not found'}, status=404)

def get_user_by_login(request, login):
	try:
		user = User.objects.get(login=login)
		user_dict = model_to_dict(user)
		user_dict['image'] = str(user_dict['image'])
		return JsonResponse({'user': user_dict}, safe=False)
	except User.DoesNotExist:
		return JsonResponse({'error': 'User not found'}, status=404)

def get_all_users(request):
	users = User.objects.all()
	users_dict = [model_to_dict(user) for user in users]
	for user_dict in users_dict:
		user_dict['image'] = str(user_dict['image'])
	return JsonResponse({'users': users_dict}, safe=False)