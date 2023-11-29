from django.db import models

class	Player(models.Model):
	firstName = models.CharField(max_length=20);
	name = models.CharField(max_length=20);
	idName = models.CharField(max_length=20);

class	Game(models.Model):
	date = models.DateField();
	hour = models.TimeField();
	duration = models.IntegerField();
	players = models.ManyToManyField(Player);

class	Score(models.Model):
	players = models.ForeignKey(Player, on_delete=models.CASCADE)
	game = models.ForeignKey(Game, on_delete=models.CASCADE)
	points = models.IntegerField()

class	PongGameState(models.Model):
	paddle_position = models.IntegerField(default=0)


class User(models.Model):
	login = models.CharField(max_length=20);
	email = models.CharField(max_length=20);
	firstName = models.CharField(max_length=20);
	lastName = models.CharField(max_length=20);
	image = models.ImageField(upload_to='images/', default='images/None/No-img.jpg');
	campus = models.CharField(max_length=20);
	level = models.IntegerField();
	wallet = models.IntegerField();
	correctionPoint = models.IntegerField();
	location = models.CharField(max_length=20);