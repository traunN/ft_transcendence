
document.addEventListener('DOMContentLoaded', initializeTournamentGame);

window.tournamentGameData = {
	shouldCloseSocket: false,
	socket: null,
	lobbySocket: null,
	user: JSON.parse(sessionStorage.getItem('user')),
	jwtToken: sessionStorage.getItem('jwt'),
	reloadLeave: true,
	gameLeave: false,
	isWinner: false,
	gameRoomStarted: false,
	isGameRunning: false
};

function initializeTournamentGame() {
	let userId;
	var tournamentId = document.getElementById('tournamentId').value;
	var roomName = document.getElementById('roomName').value;
	const board = document.querySelector('.board');
	const ball = document.querySelector('.ball');
	const paddle1 = document.querySelector('.paddle_1');
	const paddle2 = document.querySelector('.paddle_2');
	const player1Score = document.querySelector('.player_1_score');
	const player2Score = document.querySelector('.player_2_score');
	const message = document.querySelector('.message');
	var boardSkin = sessionStorage.getItem('boardSkin') || 'defaultSkin';
	var ballSkin = sessionStorage.getItem('ballSkin') || 'defaultSkin';
	var paddleSkin = sessionStorage.getItem('paddleSkin') || 'defaultSkin';
	var roomNameKey = sessionStorage.getItem('roomNameKey');
	var jwtToken = window.tournamentGameData.jwtToken;
	let user = window.tournamentGameData.user;
	if (!user) {
		return;
	}
	if (roomNameKey) {
		if (roomNameKey !== roomName) {
			sessionStorage.setItem('roomNameKey', '');
			window.tournamentGameData.reloadLeave = false;
			history.back();
		}
	}
	else {
		sessionStorage.setItem('roomNameKey', '');
		window.tournamentGameData.reloadLeave = false;
		history.back();
	}

	if (boardSkin === 'defaultSkin') {
		board.classList.add('blackSkin');
	}
	else {
		board.classList.add(boardSkin);
	}
	ball.classList.add(ballSkin);
	paddle1.classList.add(paddleSkin);
	paddle2.classList.add(paddleSkin);

	if (user.id) {
		userId = user.id;
	}

	const keys = {
		ArrowUp: false,
		ArrowDown: false,
		KeyW: false,
		KeyS: false,
		Enter: false
	};

	let player1ScoreValue = 0;
	let player2ScoreValue = 0;
	let previousX = 0;
	let previousY = 0;
	let paddle1Y = 300;
	let paddle2Y = 300;
	let interpolationFactor = 0.1;
	let targetPaddle1Y = paddle1Y;
	let targetPaddle2Y = paddle2Y;

	window.tournamentGameData.lobbySocket = new WebSocket('wss://localhost:8443/ws/tournament_lobby/' + tournamentId + '/');
	
	window.tournamentGameData.lobbySocket.onerror = function (e) {
		console.log('tournament game lobby socket error');
	};

	window.tournamentGameData.lobbySocket.onmessage = function (e) {
		var data = JSON.parse(e.data);
		if (data.type === 'canceled_room') {
			console.log('canceled_room');
			if (data.room_name === roomName) {
				if (data.user_id !== userId) {
					window.tournamentGameData.isWinner = true;
					window.tournamentGameData.gameLeave = true;
					window.tournamentGameData.isGameRunning = false;
					// window.location.href = '/tournament_lobby/' + tournamentId;
					navigateToCustompath('/tournament_lobby/' + tournamentId);
				}
				else {
					window.tournamentGameData.isWinner = false;
					window.tournamentGameData.gameLeave = true;
					window.tournamentGameData.isGameRunning = false;
					// window.location.href = '/tournament/';
					navigateToCustompath('/tournament/');
				}
			}
		}
		else if (data.type === 'cancel_lobby') {
			console.log('cancel_lobby');
			window.tournamentGameData.isWinner = false;
			window.tournamentGameData.gameLeave = true;
			window.tournamentGameData.isGameRunning = false;
			// window.location.href = '/tournament/';
			navigateToCustompath('/tournament/');
		}
	};

	function update_ball_position(updated_ball_position) {
		const ballPositionObj = JSON.parse(updated_ball_position);
		const x = ballPositionObj.x;
		const y = ballPositionObj.y;
		const newX = x + (x - previousX) * interpolationFactor;
		const newY = y + (y - previousY) * interpolationFactor;
		previousX = x;
		previousY = y;
		ball.style.left = `${newX}px`;
		ball.style.top = `${newY}px`;
	}

	function update_paddle1_position(updated_paddle_position) {
		const paddlePositionObj = JSON.parse(updated_paddle_position);
		const y = paddlePositionObj.y;
		targetPaddle1Y = y;
		paddle1.style.top = `${y}px`;
		window.tournamentGameData.socket.send(JSON.stringify({ 'message': 'paddle_update_lol', 'paddle': 'paddle1', 'position': JSON.stringify({ 'x': 10, 'y': targetPaddle1Y }) }));
	}

	function update_paddle2_position(updated_paddle_position) {
		const paddlePositionObj = JSON.parse(updated_paddle_position);
		const y = paddlePositionObj.y;
		targetPaddle2Y = y;
		paddle2.style.top = `${y}px`;
		window.tournamentGameData.socket.send(JSON.stringify({ 'message': 'paddle_update_lol', 'paddle': 'paddle2', 'position': JSON.stringify({ 'x': 790, 'y': targetPaddle2Y }) }));
	}
	document.addEventListener('keydown', handleKeyEvent);
	document.addEventListener('keyup', handleKeyEvent);

	function handleKeyEvent(event) {
		if (event.type === 'keydown') {
			keys[event.code] = true;
		} else if (event.type === 'keyup') {
			keys[event.code] = false;
		}
	}

	document.getElementById("readyGamebtn").addEventListener("click", startGame);

	function update_paddles() {
		if (keys.ArrowUp) {
			targetPaddle2Y -= 10;
			if (targetPaddle2Y < 50) {
				targetPaddle2Y = 50;
			}
			window.tournamentGameData.socket.send(JSON.stringify({ 'message': 'paddle_update', 'paddle': 'paddle2', 'position': JSON.stringify({ 'x': 790, 'y': targetPaddle2Y }) }));
		}
		if (keys.ArrowDown) {
			targetPaddle2Y += 10;
			if (targetPaddle2Y > 550) {
				targetPaddle2Y = 550;
			}
			window.tournamentGameData.socket.send(JSON.stringify({ 'message': 'paddle_update', 'paddle': 'paddle2', 'position': JSON.stringify({ 'x': 790, 'y': targetPaddle2Y }) }));
		}
		if (keys.KeyW) {
			targetPaddle1Y -= 10;
			if (targetPaddle1Y < 50) {
				targetPaddle1Y = 50;
			}
			window.tournamentGameData.socket.send(JSON.stringify({ 'message': 'paddle_update', 'paddle': 'paddle1', 'position': JSON.stringify({ 'x': 10, 'y': targetPaddle1Y }) }));
		}
		if (keys.KeyS) {
			targetPaddle1Y += 10;
			if (targetPaddle1Y > 550) {
				targetPaddle1Y = 550;
			}
			window.tournamentGameData.socket.send(JSON.stringify({ 'message': 'paddle_update', 'paddle': 'paddle1', 'position': JSON.stringify({ 'x': 10, 'y': targetPaddle1Y }) }));
		}

		paddle1Y += (targetPaddle1Y - paddle1Y) * interpolationFactor;
		paddle2Y += (targetPaddle2Y - paddle2Y) * interpolationFactor;
		paddle1.style.top = `${paddle1Y}px`;
		paddle2.style.top = `${paddle2Y}px`;

		requestAnimationFrame(update_paddles);
	}


	function gameLoop(gameState) {
		window.tournamentGameData.socket.onmessage = function (event) {
			const messageData = JSON.parse(event.data);
			if (messageData.message === 'start_game') {
				const initialState = messageData.initial_state;
				setInterval(gameLoop, 1000 / 60, initialState);
			}
			else if (messageData.message === 'ball_update') {
				const updated_ball_position = messageData.ball_position;
				update_ball_position(updated_ball_position);
				console.log('reduce lag'); //have to change this not normal javascript things
			}
			else if (messageData.message === 'paddle1_update') {
				const updated_paddle_position = messageData.paddle1_position;
				if (window.tournamentGameData.isGameRunning)
					update_paddle1_position(updated_paddle_position);
			}
			else if (messageData.message === 'paddle2_update') {
				const updated_paddle_position = messageData.paddle2_position;
				update_paddle2_position(updated_paddle_position);
			}
			else if (messageData.message === 'score_update') {
				const score1 = messageData.score1;
				const score2 = messageData.score2;
				player1ScoreValue = score1;
				player2ScoreValue = score2;
				player1Score.textContent = `${player1ScoreValue}`;
				player2Score.textContent = `${player2ScoreValue}`;
			}
			else if (messageData.message === 'game_over') {
				window.tournamentGameData.gameLeave = true;
				window.tournamentGameData.isGameRunning = false;
				const winner = messageData.winner;
				const loser = messageData.loser;
				message.style.display = 'block';
				console.log('winner:', winner);
				console.log('loser:', loser);
				if (userId == winner) {
					window.tournamentGameData.isWinner = true;
					message.textContent = 'You won!';
					setTimeout(function () {
						// window.location.href = '/tournament_lobby/' + tournamentId;
						navigateToCustompath('/tournament_lobby/' + tournamentId);
					}, 3000);
				}
				else {
					window.tournamentGameData.isWinner = false;
					message.textContent = 'You lost!';
					setTimeout(function () {
						// window.location.href = '/tournament/';
						navigateToCustompath('/tournament/');
					}, 3000);
				}
			}
			else {
				const gameState = messageData.message;
			}
		};
		update_paddles();
		window.tournamentGameData.socket.onclose = function (event) {
			window.tournamentGameData.isGameRunning = false;
		};
	}

	function displayNames(player1NameValue, player2NameValue) {
		console.log('displayNames')
		const player1Name = document.querySelector('.player_1_name');
		const player2Name = document.querySelector('.player_2_name');
		player1Name.style.display = 'block';
		player2Name.style.display = 'block';
		player1Name.textContent = `${player1NameValue}`;
		player2Name.textContent = `${player2NameValue}`;
	}

	function startGame() {
		if (window.tournamentGameData.isGameRunning) {
			return;
		}
		window.tournamentGameData.gameRoomStarted = true;
		message.textContent = '';
		readyGamebtn.style.display = 'none';
		window.tournamentGameData.isGameRunning = true;
		let userId = user.id;
		fetch('/create_tournament_game/' + tournamentId + '/' + roomName + '/' + userId + '/')
			.then(response => {
				if (!response.ok) {
					throw new Error('Network response was not ok');
				}
				return response.json();
			})
			.then(data => {
				if (data.status === 'success') {
					console.log('tournament game room created');
					window.tournamentGameData.socket = new WebSocket('wss://localhost:8443/ws/tournament_game/' + roomName + '/');
					if (!window.tournamentGameData.socket) {
						console.log('Failed to create socket');
						return;
					}
					console.log('socket :', window.tournamentGameData.socket);
					if (data.start_game) {
						window.room_name = data.room_name;

						window.tournamentGameData.socket.onopen = async function (event) {
							window.tournamentGameData.socket.send(JSON.stringify({ 'message': 'start_game' }));
							window.tournamentGameData.socket.onmessage = function (event) {
								const messageData = JSON.parse(event.data);
								if (messageData.message === 'start_game') {
									message.textContent = '';
									const user1 = messageData.user1;
									const user2 = messageData.user2;
									displayNames(user1, user2);
									// Handle the initial game state
									const initialState = messageData.initial_state;
									gameLoop(initialState);
								} else {
									// Handle other game messages
									gameState = messageData.message;
									// gameLoop(gameState);
								}

							};
						};
					} else {
						message.textContent = 'Waiting for another player...';
						window.room_name = data.room_name;
						window.tournamentGameData.socket.onopen = function (event) {
							window.tournamentGameData.socket.onmessage = function (event) {
								const messageData = JSON.parse(event.data);
								if (messageData.message === 'start_game') {
									// Handle the initial game state
									message.textContent = '';
									const user1 = messageData.user1;
									const user2 = messageData.user2;
									displayNames(user1, user2);
									const initialState = messageData.initial_state;
									gameLoop(initialState);
								} else {
									// Handle other game messages
									gameState = messageData.message;
									gameLoop(gameState);
								}
							};
						};
					}
				}
				else {
					console.log('Error creating tournament game room');
					console.log(data);
				}
			})
			.catch(error => console.error(error));
	}

	
}
function leaveLobby() {
	var tournamentId = document.getElementById('tournamentId').value;
	var userId = window.tournamentGameData.user.id;
	var jwtToken = window.tournamentGameData.jwtToken;
	const formData = new FormData();
	formData.append('tournament_id', tournamentId);
	window.tournamentGameData.reloadLeave = false;
	window.tournamentGameData.isGameRunning = false;

	if (!window.tournamentGameData.isWinner) {
		console.log('LOST');
	}
	fetch('/leave_tournament/' + userId + '/', {
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
				if (window.tournamentGameData.gameRoomStarted) {
					window.tournamentGameData.socket.close();
				}
				window.tournamentGameData.lobbySocket.close();

			}
			else {
				console.log('Error leaving tournament');
				console.log(response);
			}
		})
		.catch(error => console.error(error));
}

window.addEventListener('beforeunload', customOnBeforeUnload);

function customOnBeforeUnload() {
	window.removeEventListener('beforeunload', customOnBeforeUnload);
	var userId = window.tournamentGameData.user.id;
	var reloadLeave = window.tournamentGameData.reloadLeave;
	var gameLeave = window.tournamentGameData.gameLeave;
	var isWinner = window.tournamentGameData.isWinner;
	var gameRoomStarted = window.tournamentGameData.gameRoomStarted;
	var tournamentId = document.getElementById('tournamentId').value;
	var roomName = document.getElementById('roomName').value;
	var jwtToken = window.tournamentGameData.jwtToken;
	console.log('beforeunload');
	if (reloadLeave && !gameLeave) {
		window.tournamentGameData.lobbySocket.send(JSON.stringify({
			'type': 'canceled_room',
			'user_id': userId,
			'room_name': roomName,
			'tournament_id': tournamentId,
		}));
		leaveLobby();
	}
	else if (reloadLeave && gameLeave && !isWinner) {
		leaveLobby();
	}
	else if (reloadLeave && gameLeave && isWinner) {
		fetch('/get_tournament_status/' + tournamentId + '/')
			.then(response => response.text())
			.then(data => {
				var response = JSON.parse(data);
				if (response.status === 'success') {
					if (response.tournament_status === 'second_match_finished') {
						fetch(`/change_tournament_status/${tournamentId}/`, {
							method: 'POST',
							headers: {
								'Content-Type': 'application/json',
								'X-CSRFToken': csrfToken,
								'Authorization': `Bearer ${jwtToken}`
							},
							body: JSON.stringify({ 'status': 'final_match_finished' })
						})
							.then(response => response.text())
							.then(data => {
								var response = JSON.parse(data);
								if (response.status === 'success') {
									console.log('tournament status changed');
								}
								else {
									console.log('Error changing tournament status');
									console.log(response);
								}
							})
						window.tournamentGameData.lobbySocket.send(JSON.stringify({
							'type': 'final_match_finished',
							'winner_id': userId,
							'tournament_id': tournamentId,
						}));
					}
					else if (response.tournament_status === 'first_match_finished') {
						fetch(`/change_tournament_status/${tournamentId}/`, {
							method: 'POST',
							headers: {
								'Content-Type': 'application/json',
								'X-CSRFToken': csrfToken,
								'Authorization': `Bearer ${jwtToken}`
							},
							body: JSON.stringify({ 'status': 'second_match_finished' })
						})
							.then(response => response.text())
							.then(data => {
								var response = JSON.parse(data);
								if (response.status === 'success') {
									console.log('tournament status changed');
								}
								else {
									console.log('Error changing tournament status');
									console.log(response);
								}
							})
						window.tournamentGameData.lobbySocket.send(JSON.stringify({
							'type': 'second_match_finished',
							'winner_id': userId,
							'tournament_id': tournamentId,
						}));
					}
					else {
						fetch(`/change_tournament_status/${tournamentId}/`, {
							method: 'POST',
							headers: {
								'Content-Type': 'application/json',
								'X-CSRFToken': csrfToken,
								'Authorization': `Bearer ${jwtToken}`
							},
							body: JSON.stringify({ 'status': 'first_match_finished' })
						})
							.then(response => response.text())
							.then(data => {
								var response = JSON.parse(data);
								if (response.status === 'success') {
									console.log('tournament status changed');
								}
								else {
									console.log('Error changing tournament status');
									console.log(response);
								}
								a
							})
						window.tournamentGameData.lobbySocket.send(JSON.stringify({
							'type': 'first_match_finished',
							'winner_id': userId,
							'tournament_id': tournamentId,
						}));
					}
				}
				else {
					console.log('Error retrieving tournament status');
					console.log(response);
				}
			}
			)
		if (gameRoomStarted) {
			window.tournamentGameData.socket.close();
		}
	}
}