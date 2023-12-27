document.addEventListener('DOMContentLoaded', function () {
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
		lobbysocket.send(JSON.stringify({
			'type': 'tournament_lobby_updated',
			'tournament_id': tournamentId,
		}));
	});

	lobbysocket.onmessage = function (event) {
		var data = JSON.parse(event.data);
		if (data.type === 'tournament_lobby_updated') {
			updatePlayersList();
		}
	};

	function updatePlayersList() {
		// Clear the current list
		while (playersList.firstChild) {
			playersList.removeChild(playersList.firstChild);
		}
	 
		// Use AJAX to get the updated list of players
		var xhr = new XMLHttpRequest();
		xhr.open("GET", '/get_players_in_tournament/' + tournamentId + '/', true);
		xhr.onreadystatechange = function () {
			if (xhr.readyState == 4 && xhr.status == 200) {
				var data = JSON.parse(xhr.responseText);
				var players = data.players;
				
				// Convert the players array to a Set to remove duplicates, then convert it back to an array
				var uniquePlayers = Array.from(new Set(players.map(player => JSON.stringify(player)))).map(player => JSON.parse(player));
				
				for (var i = 0; i < uniquePlayers.length; i++) {
					var player = uniquePlayers[i];
					var li = document.createElement('li');
					var readyStatusIndicator = document.createElement('span');
					readyStatusIndicator.className = 'readyStatusIndicator';
					if (player.is_ready) {
					   readyStatusIndicator.style.backgroundColor = '#00e500';
					} else {
					   readyStatusIndicator.style.backgroundColor = 'red';
					}
					li.appendChild(readyStatusIndicator);
					li.innerHTML += ' ' + player.login + ' <span class="aliasSpan">' + player.alias + '</span>';
					playersList.appendChild(li);
				}
				document.getElementById('PlayerCount').innerHTML = 'Players: ' + uniquePlayers.length + ' / 4';
			}
		};
		xhr.send();
	}


	document.getElementById('startTournamentBtn').addEventListener('click', function () {
		updatePlayersList();
		var xhr = new XMLHttpRequest();
		xhr.open("GET", '/get_players_in_tournament/' + tournamentId + '/', true);
		xhr.onreadystatechange = function () {
			if (xhr.readyState == 4 && xhr.status == 200) {
				var data = JSON.parse(xhr.responseText);
				var players = data.players;
				var uniquePlayers = Array.from(new Set(players.map(player => JSON.stringify(player)))).map(player => JSON.parse(player));
				var allReady = true;
				if (uniquePlayers.length === 4) {
					for (var i = 0; i < uniquePlayers.length; i++) {
						if (!uniquePlayers[i].is_ready) {
							allReady = false;
							break;
						}
					}
					if (allReady) {
						var tournamentId = document.getElementById('tournamentId').value;
						const formData = new FormData();
						formData.append('tournament_id', tournamentId);

						fetch('/start_tournament/' + user.id + '/', {
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
									if (isOpen(lobbysocket)) {
										lobbysocket.send(JSON.stringify({
											'type': 'tournament_lobby_updated',
											'tournament_id': tournamentId,
										}));
									}
									window.location.href = '/tournament/' + tournamentId;
								}
								else {
									console.log('Error starting tournament');
									console.log(response);
								}
							})
							.catch(error => console.error(error));
					}
					else {
						displayError('All players must be ready to start the tournament');
					}
				}
				else {
					displayError('There must be 4 players to start the tournament');
				}
			}
		};
		xhr.send();
	});


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
					if (isOpen(lobbysocket)) {
						lobbysocket.send(JSON.stringify({
							'type': 'tournament_lobby_updated',
							'tournament_id': tournamentId,
						}));
					}
					if (alias === '')
						changePlayerReadyStatus();
				}
				else {
					console.log('Error changing tournament user alias');
					console.log(response);
				}
			})
			.catch(error => console.error(error));
	});

	function displayError(message) {
		var errorElement = document.getElementById('errorMessage');
		errorElement.textContent = message;
		errorElement.classList.remove('hide');
		errorElement.classList.add('error');
		setTimeout(function() {
			errorElement.classList.add('hide');
		}, 5000);
	}


	function changePlayerReadyStatus() {
		var user = JSON.parse(sessionStorage.getItem('user'));
		var tournamentId = document.getElementById('tournamentId').value;
		var alias = document.getElementById('aliasInput').value;
		if (!alias) {
			displayError('Please enter an alias');
		}
		const formData = new FormData();
		formData.append('alias', alias);
		formData.append('tournament_id', tournamentId);
		formData.append('user_id', user.id);

		fetch('/set_player_ready/', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				'X-CSRFToken': csrfToken,
			},
			body: JSON.stringify(Object.fromEntries(formData))
		})
			.then(response => response.json())
			.then(data => {
				if (data.status === 'success') {
					if (isOpen(lobbysocket)) {
						lobbysocket.send(JSON.stringify({
							'type': 'tournament_lobby_updated',
							'tournament_id': tournamentId,
						}));
					}
				}
				else {
					console.log('Error setting player ready');
					console.log(data);
				}
			})
			.catch(error => console.error(error));
	}

	document.getElementById('readyButton').addEventListener('click', function () {
		changePlayerReadyStatus();
	});

	// leave button
	document.getElementById('leaveTournamentBtn').addEventListener('click', function () {
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
					if (isOpen(pagesocket)) {
						pagesocket.close();
					}
					if (isOpen(lobbysocket)) {
						lobbysocket.close();
					}
					history.back();
				}
				else {
					console.log('Error leaving tournament');
					console.log(response);
				}
			})
			.catch(error => console.error(error));
	});


	window.addEventListener('beforeunload', function (event) {

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
					if (isOpen(pagesocket)) {
						pagesocket.close();
					}
					if (isOpen(lobbysocket)) {
						lobbysocket.close();
					}
					history.back();
				}
				else {
					console.log('Error leaving tournament');
					console.log(response);
				}
			})
			.catch(error => console.error(error));


	});

});
