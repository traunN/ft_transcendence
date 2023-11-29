from django.shortcuts import render
from django.db import connection
from pong_app.models import PongGameState
from django.views.decorators.csrf import csrf_exempt
from pong_app.models import User
from django.http import JsonResponse
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

def profil(request):
	return render(request, 'profil.html')

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
		data = json.loads(request.body)
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
			location=data['location']
		)
		return JsonResponse({'message': 'User profile saved successfully'}, status=200)
	else:
		return JsonResponse({'error': 'Invalid request'}, status=400)
