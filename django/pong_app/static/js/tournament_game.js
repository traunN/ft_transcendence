let isGameRunning = false;
let userId;
let winner = false;
let justReload = false;

document.addEventListener('DOMContentLoaded', function () {
	let reloadLeave = true;
	var user = JSON.parse(sessionStorage.getItem('user'));
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
	console.log('tournament id: ' + tournamentId);
	console.log('room name: ' + roomName);

	if (boardSkin === 'defaultSkin') {
		board.classList.add('blackSkin');
	}
	else {
		board.classList.add(boardSkin);
	}
	ball.classList.add(ballSkin);
	paddle1.classList.add(paddleSkin);
	paddle2.classList.add(paddleSkin);
	if (!user) {
		window.location.href = '/tournament/';
	}
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
	let ballX = 0;
	let ballY = 0;
	let targetBallX = ballX;
	let targetBallY = ballY;
	let paddle1Y = 0;
	let paddle2Y = 0;
	let interpolationFactor = 0.1;
	let targetPaddle1Y = paddle1Y;
	let targetPaddle2Y = paddle2Y;

	const pagesocket = new WebSocket('ws://' + window.location.host + '/ws/tournament/');
	const socket = new WebSocket('ws://localhost:8000/ws/tournament_game/' + roomName + '/');

	
	socket.onerror = function (error) {
		console.error('WebSocket Error: ', error);
	};
	function isOpen(ws) {
		return ws.readyState === ws.OPEN;
	}

	function update_ball_position(updated_ball_position) {
		const ballPositionObj = JSON.parse(updated_ball_position);
		ballX = ballPositionObj.x;
		ballY = ballPositionObj.y;
		targetBallX = ballX;
		targetBallY = ballY;
	}

	function update_paddle1_position(updated_paddle_position) {
		const paddlePositionObj = JSON.parse(updated_paddle_position);
		const y = paddlePositionObj.y;
		targetPaddle1Y = y;
	}

	function update_paddle2_position(updated_paddle_position) {
		const paddlePositionObj = JSON.parse(updated_paddle_position);
		const y = paddlePositionObj.y;
		targetPaddle2Y = y;
	}

	countdown(3, function () {
		startGame();
	});

	function countdown(time, callback) {
		var timer = setInterval(function () {
			if (time > 0) {
				message.style.display = 'block';
				message.textContent = time;
				time--;
			} else {
				message.style.display = 'none';
				message.textContent = '';
				clearInterval(timer);
				callback();
			}
		}, 1000);
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

	function update_paddles() {
		if (keys.ArrowUp) {
			targetPaddle2Y -= 10;
			if (targetPaddle2Y < 50) {
				targetPaddle2Y = 50;
			}
		}
		if (keys.ArrowDown) {
			targetPaddle2Y += 10;
			if (targetPaddle2Y > 550) {
				targetPaddle2Y = 550;
			}
		}
		if (keys.KeyW) {
			targetPaddle1Y -= 10;
			if (targetPaddle1Y < 50) {
				targetPaddle1Y = 50;
			}
		}
		if (keys.KeyS) {
			targetPaddle1Y += 10;
			if (targetPaddle1Y > 550) {
				targetPaddle1Y = 550;
			}
		}
		socket.send(JSON.stringify({ 'message': 'paddle_update', 'paddle': 'paddle1', 'position': JSON.stringify({ 'x': 10, 'y': targetPaddle1Y }) }));
		socket.send(JSON.stringify({ 'message': 'paddle_update', 'paddle': 'paddle2', 'position': JSON.stringify({ 'x': 790, 'y': targetPaddle2Y }) }));
	}

	function gameLoop() {
		if (!isGameRunning) {
			return;
		}
		update();
		draw();
		requestAnimationFrame(gameLoop);
	}

	function update() {
		// Handle WebSocket messages
		socket.onmessage = function (event) {
			const messageData = JSON.parse(event.data);
			console.log(messageData);
			if (messageData.message === 'ball_update') {
				const updated_ball_position = messageData.ball_position;
				update_ball_position(updated_ball_position);
				// console.log('reduce lag'); //have to change this not normal javascript things
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
				setTimeout(function () {
					location.reload();
				}, 5000);
				isGameRunning = false;
				if (player1ScoreValue > player2ScoreValue) {
					message.textContent = 'Player 1 wins!';
				}
				else {
					message.textContent = 'Player 2 wins!';
				}

			}
			else if (messageData.message === 'cancel_game_room') {
				console.log('AAAAAAAH');
				winner = true;
				isGameRunning = false;
				message.textContent = 'Player left the game';
				setTimeout(function () {
					location.reload();
				}, 5000);
			}
			else {
				const gameState = messageData.message;
			}
		};

		update_paddles();
	}

	function draw() {
		ball.style.left = `${targetBallX}px`;
		ball.style.top = `${targetBallY}px`;
		paddle1Y += (targetPaddle1Y - paddle1Y) * interpolationFactor;
		paddle2Y += (targetPaddle2Y - paddle2Y) * interpolationFactor;
		paddle1.style.top = `${paddle1Y}px`;
		paddle2.style.top = `${paddle2Y}px`;
		player1Score.textContent = `${player1ScoreValue}`;
		player2Score.textContent = `${player2ScoreValue}`;
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
		isGameRunning = true;
		let userId = user.id;
		// check if both players are in the same room
		console.log('userId: ' + userId);
		console.log('Starting game');
		socket.send(JSON.stringify({ 'message': 'start_game', 'user_id': userId }));
		socket.onmessage = function (event) {
			const messageData = JSON.parse(event.data);
			if (messageData.message === 'start_game') {
				const user1 = messageData.user1;
				const user2 = messageData.user2;
				displayNames(user1, user2);
				console.log('Game started');
				requestAnimationFrame(gameLoop);
			} else {
				// Handle other game messages
				gameState = messageData.message;
				// gameLoop(gameState);
			}

		};
	}

	function leaveLobby() {
		const formData = new FormData();
		formData.append('tournament_id', tournamentId);
		reloadLeave = false;
		isGameRunning = false;

		// cancel room
		if (!winner) {
			socket.send(JSON.stringify({ 'message': 'cancel_game_room' }));
		}

		fetch(`/cancel_room/${userId}/`, {
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
					// Send a message to the tournament lobby group
					console.log('Room canceled');
				}
				else {
					console.log('Error canceling room');
					console.log(response);
				}
			})

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
						pagesocket.close();
					}
					socket.close();
					window.location.href = '/tournament/';
				}
				else {
					console.log('Error leaving tournament');
					console.log(response);
				}
			})
			.catch(error => console.error(error));
	}

	window.addEventListener('beforeunload', function (event) {
		if (reloadLeave) {
			console.log('reloadLeaveLobby');
			event.preventDefault();
			event.returnValue = '';
			leaveLobby();
		}
	});

});
