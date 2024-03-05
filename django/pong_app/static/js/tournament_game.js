let isGameRunning = false;
let userId;
let socket;
let isWinner = false;
let gameRoomStarted = false;

document.addEventListener('DOMContentLoaded', initializeTournamentGame);

function initializeTournamentGame() {
	let reloadLeave = true;
	let gameLeave = false;
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
	var jwtToken;
	let user = JSON.parse(sessionStorage.getItem('user'));
	if (!user) {
		return;
	}
	else {
		jwtToken = sessionStorage.getItem('jwt');
	}

	console.log('tournament game room name:', roomName);
	console.log('tournament game room name key:', roomNameKey);
	if (roomNameKey){
		if(roomNameKey !== roomName) {
			sessionStorage.setItem('roomNameKey', '');
			reloadLeave = false;
			history.back();
		}
	}
	else{
		sessionStorage.setItem('roomNameKey', '');
		reloadLeave = false;
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

	const lobbysocket = new WebSocket('wss://localhost:8443/ws/tournament_lobby/' + tournamentId + '/');

	lobbysocket.onopen = function (e) {
		console.log('tournament game lobby socket opened');
	};

	lobbysocket.onerror = function (e) {
		console.log('tournament game lobby socket error');
	};

	lobbysocket.onmessage = function (e) {
		var data = JSON.parse(e.data);
		if (data.type === 'canceled_room') {
			console.log('canceled_room');
			if (data.room_name === roomName) {
				if (data.user_id !== userId) {
					isWinner = true;
					gameLeave = true;
					isGameRunning = false;
					window.location.href = '/tournament_lobby/' + tournamentId;
				}
				else {
					isWinner = false;
					gameLeave = true;
					isGameRunning = false;
					window.location.href = '/tournament/';
				}
			}
		}
		else if (data.type === 'cancel_lobby') {
			console.log('cancel_lobby');
			isWinner = false;
			gameLeave = true;
			isGameRunning = false;
			window.location.href = '/tournament/';
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
	}

	function update_paddle2_position(updated_paddle_position) {
		const paddlePositionObj = JSON.parse(updated_paddle_position);
		const y = paddlePositionObj.y;
		targetPaddle2Y = y;
		paddle2.style.top = `${y}px`;
	}
	document.addEventListener('keydown', function (event) {
		if (event.code in keys) {
			keys[event.code] = true;
		}
	});

	document.addEventListener('keyup', function (event) {
		if (event.code in keys) {
			keys[event.code] = false;
		}
	});

	document.getElementById("readyGamebtn").addEventListener("click", startGame);

	function update_paddles() {
		if (keys.ArrowUp) {
			targetPaddle2Y -= 10;
			if (targetPaddle2Y < 50) {
				targetPaddle2Y = 50;
			}
			socket.send(JSON.stringify({ 'message': 'paddle_update', 'paddle': 'paddle2', 'position': JSON.stringify({ 'x': 790, 'y': targetPaddle2Y }) }));
		}
		if (keys.ArrowDown) {
			targetPaddle2Y += 10;
			if (targetPaddle2Y > 550) {
				targetPaddle2Y = 550;
			}
			socket.send(JSON.stringify({ 'message': 'paddle_update', 'paddle': 'paddle2', 'position': JSON.stringify({ 'x': 790, 'y': targetPaddle2Y }) }));
		}
		if (keys.KeyW) {
			targetPaddle1Y -= 10;
			if (targetPaddle1Y < 50) {
				targetPaddle1Y = 50;
			}
			socket.send(JSON.stringify({ 'message': 'paddle_update', 'paddle': 'paddle1', 'position': JSON.stringify({ 'x': 10, 'y': targetPaddle1Y }) }));
		}
		if (keys.KeyS) {
			targetPaddle1Y += 10;
			if (targetPaddle1Y > 550) {
				targetPaddle1Y = 550;
			}
			socket.send(JSON.stringify({ 'message': 'paddle_update', 'paddle': 'paddle1', 'position': JSON.stringify({ 'x': 10, 'y': targetPaddle1Y }) }));
		}

		paddle1Y += (targetPaddle1Y - paddle1Y) * interpolationFactor;
		paddle2Y += (targetPaddle2Y - paddle2Y) * interpolationFactor;
		paddle1.style.top = `${paddle1Y}px`;
		paddle2.style.top = `${paddle2Y}px`;

		requestAnimationFrame(update_paddles);
	}


	function gameLoop(gameState) {
		socket.onmessage = function (event) {
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
				gameLeave = true;
				isGameRunning = false;
				const winner = messageData.winner;
				const loser = messageData.loser;
				message.style.display = 'block';
				console.log('winner:', winner);
				console.log('loser:', loser);
				if (userId == winner) {
					isWinner = true;
					message.textContent = 'You won!';
					setTimeout(function () {
						window.location.href = '/tournament_lobby/' + tournamentId;
					}, 3000);
				}
				else {
					isWinner = false;
					message.textContent = 'You lost!';
					setTimeout(function () {
						window.location.href = '/tournament/';
					}, 3000);
				}
			}
			else {
				const gameState = messageData.message;
			}
		};
		update_paddles();
		socket.onclose = function (event) {
			isGameRunning = false;
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
		if (isGameRunning) {
			return;
		}
		gameRoomStarted = true;
		message.textContent = '';
		readyGamebtn.style.display = 'none';
		isGameRunning = true;
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
					socket = new WebSocket('wss://localhost:8443/ws/tournament_game/' + roomName + '/');
					if (!socket) {
						console.log('Failed to create socket');
						return;
					}
					if (data.start_game) {
						console.log('Starting the game...');
						console.log('Joined room name:', data.room_name);
						window.room_name = data.room_name;

						socket.onopen = async function (event) {
							socket.send(JSON.stringify({ 'message': 'start_game' }));
							socket.onmessage = function (event) {
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
						console.log('Waiting for another player...');
						console.log('Created room:', data.room_name);
						window.room_name = data.room_name;
						socket.onopen = function (event) {
							socket.onmessage = function (event) {
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

	function leaveLobby() {
		const formData = new FormData();
		formData.append('tournament_id', tournamentId);
		reloadLeave = false;
		isGameRunning = false;

		if (!isWinner) {
			console.log('LOST');
		}
		if (gameRoomStarted) {
			socket.close();
			lobbysocket.close();
		}

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
					if (gameRoomStarted) {
						socket.close();
					}
					lobbysocket.close();

				}
				else {
					console.log('Error leaving tournament');
					console.log(response);
				}
			})
			.catch(error => console.error(error));
	}

	window.addEventListener('beforeunload', function (event) {
		if (reloadLeave && !gameLeave) {
			event.preventDefault();
			event.returnValue = '';
			lobbysocket.send(JSON.stringify({
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
							lobbysocket.send(JSON.stringify({
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
							lobbysocket.send(JSON.stringify({
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
								})
							lobbysocket.send(JSON.stringify({
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
				socket.close();
			}
		}
	});
}
