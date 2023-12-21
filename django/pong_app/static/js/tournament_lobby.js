document.addEventListener('DOMContentLoaded', function () {
	console.log('tournament_lobby.js loaded');

	var user = JSON.parse(sessionStorage.getItem('user'));
	var tournamentId = document.getElementById('tournamentId').value;
	var playersList = document.getElementById('playerList');

	const socket = new WebSocket('ws://' + window.location.host + '/ws/tournament/');

	function isOpen(ws) {
		return ws.readyState === ws.OPEN;
	}
	// def get_players_in_tournament(request, tournament_id):
	// 	tournament = Tournament.objects.get(id=tournament_id)
	// 	players = tournament.players.all()
	// 	players_json = serializers.serialize('json', players)
	// 	return JsonResponse(players_json, safe=False)


	fetch('/get_players_in_tournament/' + tournamentId + '/')
		.then(response => response.json())
		.then(players => {
			// parse fields from json
			var players = JSON.parse(players);
			// get all players one by one from the list
			for (var i = 0; i < players.length; i++) {
				var player = players[i];
				// create a new list item
				var li = document.createElement('li');
				// set the list item's text to the player's login
				li.innerHTML = player.fields.login;
				console.log(player.fields.login);
				// append the list item to the list
				playersList.appendChild(li);
			}
		})
		.catch(error => console.error('Error:', error));

	window.onbeforeunload = function () {
		// Remove the user from the tournament
		var user = JSON.parse(sessionStorage.getItem('user'));
		var tournamentId = document.getElementById('tournamentId').value;

		const formData = new FormData();
		formData.append('tournament_id', tournamentId);

		fetch('/leave_tournament/' + user.id + '/', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				'X-CSRFToken': csrfToken,
			},
			body: JSON.stringify(Object.fromEntries(formData))
		})
			.then(response => response.text())
			.then(data => {
				console.log(data);
				var response = JSON.parse(data);
				if (response.status === 'success') {
					// Send a message to the tournament lobby group
					if (isOpen(socket)) {
						socket.send(JSON.stringify({
							'type': 'tournament_updated',
							'tournament_id': tournamentId,
						}));
					}
				}
				else {
					console.log('Error leaving tournament');
					console.log(response);
				}
				history.back();
			})
			.catch(error => console.error(error));
	}
});
