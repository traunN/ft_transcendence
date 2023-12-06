from django.db import models

class	Player(models.Model):
	firstName = models.CharField(max_length=50);
	name = models.CharField(max_length=50);
	idName = models.CharField(max_length=50);

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
	login = models.CharField(max_length=50);
	email = models.CharField(max_length=50);
	firstName = models.CharField(max_length=50);
	lastName = models.CharField(max_length=50);
	image = models.ImageField(upload_to='profiles/');
	campus = models.CharField(max_length=50);
	level = models.IntegerField();
	wallet = models.IntegerField();
	correctionPoint = models.IntegerField();
	location = models.CharField(max_length=50);
	idName = models.CharField(max_length=50);
