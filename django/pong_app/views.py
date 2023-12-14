from django.shortcuts import render
from django.views import View
from django.db import connection
from django.views.decorators.csrf import csrf_exempt
from pong_app.models import User
from django.http import JsonResponse
from django.core import serializers
from django.forms.models import model_to_dict
from django.db.models import Q
from .models import GameRoom, User, RoomPlayer
import json

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