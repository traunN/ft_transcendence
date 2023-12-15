from django.db import models

class User(models.Model):
	login = models.CharField(max_length=50);
	email = models.CharField(max_length=50);
	firstName = models.CharField(max_length=50);
	lastName = models.CharField(max_length=50);
	campus = models.CharField(max_length=50);
	level = models.IntegerField();
	wallet = models.IntegerField();
	correctionPoint = models.IntegerField();
	location = models.CharField(max_length=50);
	idName = models.CharField(max_length=50);
	image = models.ImageField(upload_to='images/', default='images/None/No-img.jpg');
	wins = models.IntegerField(default=0);
	loses = models.IntegerField(default=0);
	elo = models.IntegerField(default=0);

class GameRoom(models.Model):
	name = models.CharField(max_length=200)
	players = models.ManyToManyField(User, through='RoomPlayer')
	gameState = models.CharField(max_length=200)
	player_count = models.IntegerField(default=0)
	ball_position = models.CharField(max_length=200)
	paddle1_position = models.CharField(max_length=200)
	paddle2_position = models.CharField(max_length=200)
	score1 = models.IntegerField(default=0)
	score2 = models.IntegerField(default=0)
	
class RoomPlayer(models.Model):
	user = models.ForeignKey(User, on_delete=models.CASCADE)
	room = models.ForeignKey(GameRoom, on_delete=models.CASCADE)
	count = models.IntegerField(default=1)
