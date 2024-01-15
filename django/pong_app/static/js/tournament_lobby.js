document.addEventListener('DOMContentLoaded', function () {
	var user = JSON.parse(sessionStorage.getItem('user'));
	var aliasInput = document.getElementById('aliasInput');
	var tournamentId = document.getElementById('tournamentId').value;
	var playersList = document.getElementById('playerList');
	var loadingMessage = document.getElementById('loadingMessage');
	var tournamentLobbyKey = sessionStorage.getItem('tournamentLobbyKey');
	var statusText = document.getElementById('statusText');
	let gameStarted = true;
	let reloadLeaveLobby = true;
	var roomName1;
	var roomName2;
	let is_in_room1 = false;


	const pagesocket = new WebSocket('ws://' + window.location.host + '/ws/tournament/');
	const lobbysocket = new WebSocket('ws://' + window.location.host + '/ws/tournament_lobby/' + tournamentId + '/');
	function isOpen(ws) {
		return ws.readyState === ws.OPEN;
	}

	if (tournamentLobbyKey){
		console.log('tournamentLobbyKey', tournamentLobbyKey);
		console.log('tournamentId', tournamentId);
		if(tournamentLobbyKey !== tournamentId) {
			sessionStorage.setItem('tournamentLobbyKey', '');
			reloadLeaveLobby = false;
			history.back();
		}
	}
	else{
		sessionStorage.setItem('tournamentLobbyKey', '');
		reloadLeaveLobby = false;
		history.back();
	}

	fetch('/get_tournament_status/' + tournamentId + '/')
		.then(response => response.text())
		.then(data => {
			var response = JSON.parse(data);
			if (response.status === 'success') {
				if (response.tournament_status === 'second_match_finished') {
					reloadLeaveLobby = false;
					sessionStorage.setItem('roomNameKey', user.id );
					setTimeout(function () {
						window.location.href = '/tournament_game/' + tournamentId + '/' + user.id + '/';
					}, 3000);
				}
				else if (response.tournament_status === 'final_match_finished') {
					reloadLeaveLobby = false;
					fetch('/user_win_tournament/' + user.id + '/', {
						method: 'POST',
						headers: {
							'Content-Type': 'application/json',
							'X-CSRFToken': csrfToken,
						},
					})
						.then(response => response.text())
						.then(data => {
							var response = JSON.parse(data);
							if (response.status === 'success') {
								setTimeout(function () {
									window.location.href = '/tournament/';
								}, 3000);
							}
							else {
								console.log('Error getting tournament status');
								console.log(response);
							}
						})
						.catch(error => console.error(error));
				}
			}
			else {
				console.log('Error getting tournament status');
				console.log(response);
			}
		})
		.catch(error => console.error(error));

	lobbysocket.onopen = function (e) {
		console.log('lobbysocket opened');
		loadingMessage.style.display = 'block';
		// wait a second to refresh
		lobbysocket.send(JSON.stringify({
			'type': 'tournament_lobby_updated',
			'tournament_id': tournamentId,
		}));
		setTimeout(function () {
			loadingMessage.style.display = 'none';
		}, 600);
	};

	lobbysocket.onclose = function (e) {
		console.log('lobbysocket closed');
	};

	lobbysocket.onmessage = function (event) {
		var data = JSON.parse(event.data);
		if (data.type === 'tournament_lobby_updated') {
			console.log('tournament_lobby_updated');
			setTimeout(function () {
				updatePlayersList();
			}, 600);
		}
		else if (data.type === 'tournament_lobby_game_started') {
			statusText.innerHTML = 'Round 1';
			gameStarted = true;
			console.log('Game started');
			if (isOpen(pagesocket)) {
				pagesocket.send(JSON.stringify({
					'type': 'tournament_updated',
				}));
			}
			// get room1 and room2 name
			roomName1 = data.room_name1;
			roomName2 = data.room_name2;
			if (user.id == roomName1.split('&')[0] || user.id == roomName1.split('&')[1]) {
				roomName1 = roomName1.replace('&', '');
				is_in_room1 = true;
			}
			else {
				roomName2 = roomName2.replace('&', '');
				is_in_room1 = false;
			}
			if (is_in_room1) {
				reloadLeaveLobby = false;
				sessionStorage.setItem('roomNameKey', roomName1);
				setTimeout(function () {
					window.location.href = '/tournament_game/' + tournamentId + '/' + roomName1 + '/';
				}, 3000);
			}
		}
		else if (data.type === 'first_match_finished') {
			statusText.innerHTML = 'Round 2';
			console.log('first match finished');
			// get userid of winner
			var winnerId = data.winner_id;
			if (user.id == winnerId) {
				is_in_room1 = true;
			}
			else {
				is_in_room1 = false;
			}
			if (!is_in_room1) {
				reloadLeaveLobby = false;
				sessionStorage.setItem('roomNameKey', roomName2);
				setTimeout(function () {
					window.location.href = '/tournament_game/' + tournamentId + '/' + roomName2 + '/';
				}, 3000);
			}
		}
		else if (data.type === 'second_match_finished') {
			statusText.innerHTML = 'Final Round';
			var winnerId = data.winner_id;
			console.log('second match finished');
			// get last two players name
			reloadLeaveLobby = false;
			setTimeout(function () {
				sessionStorage.setItem('roomNameKey', winnerId);
				window.location.href = '/tournament_game/' + tournamentId + '/' + winnerId + '/';
			}, 3000);
		}
		else if (data.type === 'cancel_lobby') {
			console.log('cancel_lobby');
			reloadLeaveLobby = false;
			window.location.href = '/tournament/';
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


				for (var i = 0; i < players.length; i++) {
					var li = document.createElement('li');
					var readyStatusIndicator = document.createElement('span');
					readyStatusIndicator.className = 'readyStatusIndicator';
					if (players[i].is_ready) {
						readyStatusIndicator.style.backgroundColor = '#00e500';
					} else {
						readyStatusIndicator.style.backgroundColor = 'red';
					}
					li.appendChild(readyStatusIndicator);
					li.innerHTML += ' ' + players[i].login + ' <span class="aliasSpan">' + players[i].alias + '</span>';
					playersList.appendChild(li);

				}
				document.getElementById('PlayerCount').innerHTML = 'Players: ' + players.length + ' / 4';
			}
		};
		xhr.send();
	}

	document.getElementById('startTournamentBtn').addEventListener('click', function () {
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
						roomName1 = uniquePlayers[0].idName + '&' + uniquePlayers[1].idName;
						roomName2 = uniquePlayers[2].idName + '&' + uniquePlayers[3].idName;
						if (isOpen(lobbysocket)) {
							fetch('/change_tournament_status/' + tournamentId + '/', {
								method: 'POST',
								headers: {
									'Content-Type': 'application/json',
									'X-CSRFToken': csrfToken,
								},
								body: JSON.stringify({
									'status': 'started',
								})
							})
							lobbysocket.send(JSON.stringify({
								'type': 'tournament_lobby_game_started',
								'tournament_id': tournamentId,
								'room_name1': roomName1,
								'room_name2': roomName2,
							}));
						}
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
		setTimeout(function () {
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

	function leaveLobby() {
		const formData = new FormData();
		formData.append('tournament_id', tournamentId);
		reloadLeaveLobby = false;

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
						// if tournament is anything but available then cancel lobby
						fetch('/get_tournament_status/' + tournamentId + '/')
							.then(response => response.text())
							.then(data => {
								var response = JSON.parse(data);
								if (response.status === 'success') {
									if (isOpen(lobbysocket)) {
										lobbysocket.send(JSON.stringify({
											'type': 'tournament_lobby_updated',
											'tournament_id': tournamentId,
										}));
										lobbysocket.close();
									}
									if (response.tournament_status === 'started' || response.tournament_status === 'first_match_finished' || response.tournament_status === 'second_match_finished' || response.tournament_status === 'final_match_finished') {
										lobbysocket.send(JSON.stringify({
											'type': 'cancel_lobby',
											'tournament_id': tournamentId,
										}));
										fetch('/change_tournament_status/' + tournamentId + '/', {
											method: 'POST',
											headers: {
												'Content-Type': 'application/json',
												'X-CSRFToken': csrfToken,
											},
											body: JSON.stringify({
												'status': 'canceled',
											})
										})
									}
								}
								else {
									console.log('Error getting tournament status');
									console.log(response);
								}
							})
							.catch(error => console.error(error));
						pagesocket.close();
					}
					
					window.location.href = '/tournament/';
				}
				else {
					console.log('Error leaving tournament');
					console.log(response);
				}
			})
			.catch(error => console.error(error));
	}

	document.getElementById('leaveTournamentBtn').addEventListener('click', function () {
		leaveLobby();
	});

	window.addEventListener('beforeunload', function (event) {
		if (reloadLeaveLobby) {
			console.log('reloadLeaveLobby');
			event.preventDefault();
			event.returnValue = '';
			leaveLobby();
		}
	});

});
