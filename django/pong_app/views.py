from django.shortcuts import render
from django.db import connection
from pong_app.models import PongGameState

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

def testDBConnection(request):
	try:
		with connection.cursor() as cursor:
			cursor.execute("SELECT 1")
		connection.close()
		return render(request, 'success.html')
	except Exception as error:
		return render(request, 'error.html')