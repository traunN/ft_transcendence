let isGameRunning = false;
let socket;
let userId;

document.addEventListener('DOMContentLoaded', function () {
	const board = document.querySelector('.board');
	const paddle1 = document.querySelector('.paddle_1');
	const paddle2 = document.querySelector('.paddle_2');
	const ball = document.querySelector('.ball');
	const player1Score = document.querySelector('.player_1_score');
	const player2Score = document.querySelector('.player_2_score');
	const message = document.querySelector('.message');
	let user = JSON.parse(sessionStorage.getItem('user'));
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
	let time = 30;
	let timer;
	let previousX = 0;
	let previousY = 0;
	let paddle1Y = 300;
	let paddle2Y = 300;
	let interpolationFactor = 0.1;
	let targetPaddle1Y = paddle1Y;
	let targetPaddle2Y = paddle2Y;

	function update_ball_position(updated_ball_position) {
		const ballPositionObj = JSON.parse(updated_ball_position);
		const x = ballPositionObj.x;
		const y = ballPositionObj.y;
		const newX = x + (x - previousX) * 0.1;
		const newY = y + (y - previousY) * 0.1;
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
	
	function resetRound() {
		// Reset ball position
		ball.style.left = `${board.clientWidth / 2 - ball.clientWidth / 2}px`;
		ball.style.top = `${board.clientHeight / 2 - ball.clientHeight / 2}px`;
		if (Math.random() > 0.5) {
			ballSpeedX = 4;
		}
		else {
			ballSpeedX = -4;
		}
		if (Math.random() > 0.5) {
			ballSpeedY = 4;
		}
		else {
			ballSpeedY = -4;
		}
	}

	document.getElementById("startGameBtn").addEventListener("click", startGame);


	document.addEventListener('keydown', function (event) {
		if (event.code in keys) {
			if (event.code === 'Enter') {
				keys.Enter = true;
				startGame();
			}
			keys[event.code] = true;
		}
	});

	// Listen for keyup events
	document.addEventListener('keyup', function (event) {
		if (event.code in keys) {
			keys[event.code] = false;
		}
	});

	function update_paddles() {
		// Update target paddle positions based on key events
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
	
		// Interpolate the paddle positions for smoother movement
		paddle1Y += (targetPaddle1Y - paddle1Y) * interpolationFactor;
		paddle2Y += (targetPaddle2Y - paddle2Y) * interpolationFactor;
	
		// Update the paddle elements
		paddle1.style.top = `${paddle1Y}px`;
		paddle2.style.top = `${paddle2Y}px`;
	
		// Request the next animation frame
		requestAnimationFrame(update_paddles);
	}


	function gameLoop(gameState) {
		socket.onmessage = function (event) {
			const messageData = JSON.parse(event.data);
			if (messageData.message === 'start_game') {
				const initialState = messageData.initial_state;
				gameTimer();
				gameLoop(initialState);
			}
			else if (messageData.message === 'ball_update') {
				const updated_ball_position = messageData.ball_position;
				update_ball_position(updated_ball_position);
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
			else {
				const gameState = messageData.message;
			}
		};
		update_paddles();
		

		socket.onclose = function (event) {
			isGameRunning = false;
		};
	}

	function stopGame() {
		fetch(`/cancel_room/${userId}/`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				'X-CSRFToken': csrfToken,
			},
		})
			.then(response => {
				if (!response.ok) {
					throw new Error('Network response was not ok');
				}
				return response.json();
			})
			.then(data => {
				if (data.status === 'success') {
					socket.close();
					console.log('Successfully cancelled room');
				} else {
					console.log('Failed to cancel room', data);
				}
			})
			.catch(error => {
				console.error('There has been a problem with your fetch operation:', error);
			});
	}

	function gameTimer() {
		time = 30;
		timer = setInterval(function () {
			time--;
			if (time <= 0 || !isGameRunning) {
				clearInterval(timer);
				stopGame();
			}
			if (isGameRunning) {
				message.textContent = `Time Remaining: ${time}`;
			}
		}, 1000);
	}

	function startGame() {
		if (isGameRunning) {
			return;
		}
		message.textContent = '';
		startGameBtn.style.display = 'none';
		isGameRunning = true;
		if (!user.id) {
			console.log('Please login');
			return;
		}
		let userId = user.id;
		fetch(`/join_or_create_room/${userId}/`)
			.then(response => {
				if (!response.ok) {
					throw new Error('Network response was not ok');
				}
				return response.json();
			})
			.then(data => {
				if (data.status === 'success') {
					console.log('Successfully joined or created room');
					socket = new WebSocket('ws://localhost:8000/ws/game/' + data.room_name + '/');
					if (!socket) {
						console.log('Failed to create socket');
						return;
					}
					console.log('socket:', socket);
					if (data.start_game) {
						console.log('Starting the game...');
						console.log('Joined room name:', data.room_name);
						window.room_name = data.room_name;
						// check if both players are in the same room
						socket.onopen = async function (event) {
							socket.send(JSON.stringify({ 'message': 'start_game' }));
							socket.onmessage = function (event) {
								const messageData = JSON.parse(event.data);
								if (messageData.message === 'start_game') {
									message.textContent = '';
									// Handle the initial game state
									const initialState = messageData.initial_state;
									gameTimer();
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
									const initialState = messageData.initial_state;
									gameTimer();
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
					console.log('Failed to join or create room', data);
					return;
				}
			})
			.catch(error => {
				console.error('There has been a problem with your fetch operation:', error);
			});
	}


	window.onbeforeunload = function () {
		fetch(`/cancel_room/${userId}/`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				'X-CSRFToken': csrfToken,
			},
		})
			.then(response => {
				if (!response.ok) {
					throw new Error('Network response was not ok');
				}
				return response.json();
			})
			.then(data => {
				if (data.status === 'success') {
					socket.close();
					console.log('Successfully cancelled room');
				} else {
					console.log('Failed to cancel room', data);
				}
			})
			.catch(error => {
				console.error('There has been a problem with your fetch operation:', error);
			});
	}
	resetRound();
});