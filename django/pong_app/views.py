from django.shortcuts import render
from django.views import View
from django.db import connection
from pong_app.models import PongGameState
from django.views.decorators.csrf import csrf_exempt
from pong_app.models import User
from django.http import JsonResponse
from django.core import serializers
from django.forms.models import model_to_dict
import json

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

def profil(request, user_id=None):
	if user_id is None:
		user_id = request.user.id
	try:
		user = User.objects.get(idName=user_id)
		return render(request, 'profil.html', {'user': user})
	except User.DoesNotExist:
		return render(request, 'profil.html', {'user': None})


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

		expected_keys = ['login', 'email', 'firstName', 'lastName', 'image', 'campus', 'level', 'wallet', 'correctionPoint', 'location', 'idName']
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
				image=data['image'],
				campus=data['campus'],
				level=data['level'],
				wallet=data['wallet'],
				correctionPoint=data['correctionPoint'],
				location=data['location'],
				idName=data['idName']
			)
			return JsonResponse({'message': 'User profile saved successfully'}, status=200)
	else:
		return JsonResponse({'error': 'Invalid request'}, status=400)

def get_user(request, user_id):
	try:
		user = User.objects.get(idName=user_id)
		user_dict = model_to_dict(user)
		user_dict['image'] = user.image.url
		return JsonResponse({'user': user_dict}, safe=False)
	except User.DoesNotExist:
		return JsonResponse({'error': 'User not found'}, status=404)
