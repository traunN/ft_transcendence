document.addEventListener('DOMContentLoaded', initializeTournamentLobby);

function initializeTournamentLobby() {
	var aliasInput = document.getElementById('aliasInput');
	var tournamentId = document.getElementById('tournamentId').value;
	var playersList = document.getElementById('playerList');
	var tournamentLobbyKey = sessionStorage.getItem('tournamentLobbyKey');
	var statusText = document.getElementById('statusText');
	var jwtToken;
	let user = JSON.parse(sessionStorage.getItem('user'));
	if (!user) {
		return;
	}
	else {
		jwtToken = sessionStorage.getItem('jwt');
	}
	let gameStarted = true;
	let reloadLeaveLobby = true;
	var roomName1;
	var roomName2;
	var roomName2split;
	var room2Id1;
	var room2Id2;
	var firstMatchWinnerId;
	let is_in_room1 = false;


	const pagesocket = new WebSocket('wss://localhost:8443/ws/tournament/');
	const lobbysocket = new WebSocket('wss://localhost:8443/ws/tournament_lobby/' + tournamentId + '/');
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
	aliasInput.focus();
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
					const formData = new FormData();
					formData.append('tournament_id', tournamentId);
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
								document.getElementById('leaveTournamentBtn').style.display = 'none';
								document.getElementById('startTournamentBtn').style.display = 'none';
								document.getElementById('readyButton').style.display = 'none';
								document.getElementById('aliasInput').style.display = 'none';
								document.getElementById('PlayerCount').style.display = 'none';
								document.getElementById('statusText').innerHTML = 'Congratulations! You won the tournament!';
								setTimeout(function () {
									fetch('/leave_tournament/' + user.id + '/', {
										method: 'POST',
										headers: {
											'Content-Type': 'application/json',
											'X-CSRFToken': csrfToken,
											'Authorization': `Bearer ${jwtToken}`
										},
										body: JSON.stringify(Object.fromEntries(formData))
									})
										.then(response => response.text())
										.then(data => {
											console.log(data);
											var response = JSON.parse(data);
											if (response.status === 'success') {
												window.location.href = '/tournament/';
											}
											else {
												console.log('Error leaving tournament');
												console.log(response);
											}
										})
										.catch(error => console.error(error));
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
		var loadingMessage = document.getElementById('loadingMessage');
		console.log('loadingMessage', loadingMessage);
		loadingMessage.style.display = 'block';
		loadingMessage.innerHTML = 'Loading...AAAAAA';
		setTimeout(function () {
			lobbysocket.send(JSON.stringify({
				'type': 'tournament_lobby_updated',
				'tournament_id': tournamentId,
			}));
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
			updatePlayersList();
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
			roomName1 = data.room_name1;
			roomName2 = data.room_name2;
			roomName2split = roomName2;

			
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
			room2Id1 = roomName2split.split('&')[0];
			room2Id2 = roomName2split.split('&')[1];
			console.log(room2Id1);
			console.log(room2Id2);
			setTimeout(function () {
				lobbysocket.send(JSON.stringify({
					'type': 'next_players',
					'tournament_id': tournamentId,
					'player1': room2Id1,
					'player2': room2Id2,
				}));
			}, 1000);
			// get userid of winner
			var winnerId = data.winner_id;
			if (user.id == winnerId) {
				is_in_room1 = true;
				firstMatchWinnerId = winnerId;
			}
			else {
				is_in_room1 = false;
			}
			if (!is_in_room1) {
				reloadLeaveLobby = false;
				sessionStorage.setItem('roomNameKey', roomName2);
				setTimeout(function () {
					window.location.href = '/tournament_game/' + tournamentId + '/' + roomName2 + '/';
				}, 5000);
			}
		}
		else if (data.type === 'second_match_finished') {
			statusText.innerHTML = 'Final Round';
			var winnerId = data.winner_id;
			console.log('second match finished');
			// get last two players name
			if (firstMatchWinnerId && winnerId) {
				lobbysocket.send(JSON.stringify({
					'type': 'next_players',
					'tournament_id': tournamentId,
					'player1': firstMatchWinnerId,
					'player2': winnerId,
				}));
			}
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
		else if (data.type === 'next_players') {
			var player1 = data.player1;
			var player2 = data.player2;
			console.log('player 1: ' + player1);
			console.log('player 2: ' + player2);
			var player1Element = document.getElementById(player1);
			var player2Element = document.getElementById(player2);
			player1Element.style.backgroundColor = '#c23333';
			player2Element.style.backgroundColor = '#c23333';
		}
	};

	function updatePlayersList() {
		while (playersList.firstChild) {
			playersList.removeChild(playersList.firstChild);
		}
		var xhr = new XMLHttpRequest();
		xhr.open("GET", '/get_players_in_tournament/' + tournamentId + '/', true);
		xhr.onreadystatechange = function () {
			if (xhr.readyState == 4 && xhr.status == 200) {
				var data = JSON.parse(xhr.responseText);
				var players = data.players;


				for (var i = 0; i < players.length; i++) {
					var li = document.createElement('li');
					li.id = players[i].idName;
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
								'type': 'next_players',
								'tournament_id': tournamentId,
								'player1': uniquePlayers[0].idName,
								'player2': uniquePlayers[1].idName,
							}));
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
		jwtToken = sessionStorage.getItem('jwt');
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
				'Authorization': `Bearer ${jwtToken}`
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
				'Authorization': `Bearer ${jwtToken}`
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

}
