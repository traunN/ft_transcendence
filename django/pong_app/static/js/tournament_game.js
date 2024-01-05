let isGameRunning = false;
let userId;
let socket;
let isWinner = false;

document.addEventListener('DOMContentLoaded', function () {
	let reloadLeave = true;
	let gameLeave = false;
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
		update();
		draw();
		requestAnimationFrame(gameLoop);
	}

	function update() {
		// Handle WebSocket messages
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
				if (winner === userId) {
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
					socket = new WebSocket('ws://localhost:8000/ws/tournament_game/' + roomName + '/');
					if (!socket) {
						console.log('Failed to create socket');
						return;
					}
					if (data.start_game){
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
			socket.send(JSON.stringify({ 'message': 'cancel_game_room', 'user_id': userId }));
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
					if (isOpen(pagesocket)) {
						pagesocket.send(JSON.stringify({
							'type': 'tournament_updated',
						}));
						pagesocket.close();
					}
					socket.close();
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
		if (reloadLeave && !gameLeave) {
			event.preventDefault();
			event.returnValue = '';
			leaveLobby();
		}
		else if (reloadLeave && gameLeave && !isWinner) {
			leaveLobby();
		}
		else if (reloadLeave && gameLeave && isWinner)
		{
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
						pagesocket.close();
						socket.close();
						console.log('Room canceled');
					}
					else {
						console.log('Error canceling room');
						console.log(response);
					}
				})
		}
	});

});
