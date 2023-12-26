document.addEventListener('DOMContentLoaded', function () {
	console.log('tournament_lobby.js loaded');

	var user = JSON.parse(sessionStorage.getItem('user'));
	var aliasInput = document.getElementById('aliasInput');
	var tournamentId = document.getElementById('tournamentId').value;
	var playersList = document.getElementById('playerList');

	console.log('tournamentId: ' + tournamentId);

	const pagesocket = new WebSocket('ws://' + window.location.host + '/ws/tournament/');

	const lobbysocket = new WebSocket('ws://' + window.location.host + '/ws/tournament_lobby/' + tournamentId + '/');
	function isOpen(ws) {
		return ws.readyState === ws.OPEN;
	}

	lobbysocket.addEventListener('open', function (event) {
		console.log('Connected to websocket');
		lobbysocket.send(JSON.stringify({
			'type': 'tournament_lobby_updated',
			'tournament_id': tournamentId,
		}));
	});

	lobbysocket.onmessage = function (event) {
		var data = JSON.parse(event.data);
		console.log(data);
		if (data.type === 'tournament_lobby_updated') {
			updatePlayersList();
		}
	};

	function updatePlayersList() {
		while (playersList.firstChild) {
			playersList.removeChild(playersList.firstChild);
		}
		fetch('/get_players_in_tournament/' + tournamentId + '/')
			.then(response => response.json())
			.then(data => {
				var players = data.players; // Get the array from the response
				for (var i = 0; i < players.length; i++) {
					var player = players[i];
					var li = document.createElement('li');
					li.innerHTML = player.login + ' (' + player.alias + ')';
					playersList.appendChild(li);
				}
			})
			.catch(error => console.error('Error:', error));
		// log lobbysocket
		console.log(lobbysocket);
	}

	// on user alias input change send it to the server
	// On user alias input change send it to the server
	aliasInput.addEventListener('change', function (event) {
		var alias = aliasInput.value;
		var tournamentId = document.getElementById('tournamentId').value;
		var userId = user.id;

		const formData = new FormData();
		formData.append('alias', alias);

		fetch('/change_tournament_user_alias/' + userId + '/', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				'X-CSRFToken': csrfToken,
			},
			body: JSON.stringify(Object.fromEntries(formData))
		})
			.then(response => response.text())
			.then(data => {
				var response = JSON.parse(data);
				if (response.status === 'success') {
					// Send a message to the tournament lobby group
					if (isOpen(lobbysocket)) {
						lobbysocket.send(JSON.stringify({
							'type': 'tournament_lobby_updated',
							'tournament_id': tournamentId,
						}));
					}
				}
				else {
					console.log('Error changing tournament user alias');
					console.log(response);
				}
			})
			.catch(error => console.error(error));
	} );


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
					if (isOpen(pagesocket)) {
						pagesocket.send(JSON.stringify({
							'type': 'tournament_updated',
						}));
					}
					if (isOpen(lobbysocket)) {
						lobbysocket.send(JSON.stringify({
							'type': 'tournament_lobby_updated',
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
