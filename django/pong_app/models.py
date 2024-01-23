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
	alias = models.CharField(max_length=50, default='');
	tournamentWins = models.IntegerField(default=0);

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
	@property
	def users(self):
		return [player.user for player in self.roomplayer_set.all()]

class RoomPlayer(models.Model):
	user = models.ForeignKey(User, on_delete=models.CASCADE)
	room = models.ForeignKey(GameRoom, on_delete=models.CASCADE)
	count = models.IntegerField(default=1)

class GameHistory(models.Model):
	player1Id = models.CharField(max_length=50);
	player2Id = models.CharField(max_length=50);
	player1Login = models.CharField(max_length=50);
	player2Login = models.CharField(max_length=50);
	winnerId = models.CharField(max_length=50);
	score1 = models.IntegerField()
	score2 = models.IntegerField()
	game_date = models.DateTimeField(auto_now_add=True)

class Tournament(models.Model):
	name = models.CharField(max_length=200)
	players = models.ManyToManyField(User, through='TournamentPlayer', related_name='tournament_players')
	creator = models.ForeignKey(User, on_delete=models.CASCADE, related_name='tournament_creator')
	status = models.CharField(max_length=200)
	@property
	def is_full(self):
		return self.players.count() == 4
	@property
	def is_started(self):
		return self.status == 'started'
	@property
	def is_finished(self):
		return self.status == 'finished'
	@property
	def is_available(self):
		return not self.is_started and not self.is_finished and not self.is_full
	count = models.IntegerField(default=0)

class TournamentPlayer(models.Model):
	user = models.ForeignKey(User, on_delete=models.CASCADE)
	is_ready = models.BooleanField(default=False)
	tournament = models.ForeignKey(Tournament, on_delete=models.CASCADE)
	count = models.IntegerField(default=1)