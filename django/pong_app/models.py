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
