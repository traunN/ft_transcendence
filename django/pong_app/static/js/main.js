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

	let paddleSpeed = 5;
	let ballSpeedX = 4;
	let ballSpeedY = 4;
	let player1ScoreValue = 0;
	let player2ScoreValue = 0;
	let animationFrameId;
	let time = 30;
	let timer;

	function updateBallPosition() {
		const currentLeft = parseInt(getComputedStyle(ball).left);
		const currentTop = parseInt(getComputedStyle(ball).top);
		const paddle1Top = parseInt(getComputedStyle(paddle1).top);
		const paddle2Top = parseInt(getComputedStyle(paddle2).top);

		// Update ball position based on speed
		ball.style.left = `${currentLeft + ballSpeedX}px`;
		ball.style.top = `${currentTop + ballSpeedY}px`;

		// Check for right paddle collision
		if (currentLeft + ball.clientWidth / 2 > paddle2.offsetLeft &&
			currentTop + ball.clientHeight / 2 > paddle2Top &&
			currentTop - ball.clientHeight / 2 < paddle2Top + paddle2.clientHeight) {
			// Calculate the angle based on the paddle hit position
			const bounceAngle =
				currentTop + ball.clientHeight / 2 < paddle2Top + paddle2.clientHeight / 2
					? -Math.PI / 4
					: Math.PI / 4; // Adjust the angle multiplier as needed

			ballSpeedX = -ballSpeedX;
			ballSpeedY = Math.sign(ballSpeedY) * Math.abs(ballSpeedX) * Math.sin(bounceAngle);

			ball.style.left = `${paddle2.offsetLeft - ball.clientWidth}px`;
			paddle2.classList.add('bg-danger'); // Change the paddle's color to red

			setTimeout(function () {
				paddle2.classList.remove('bg-danger'); // Remove the color change after 500ms
			}, 500);
		}
		// Check for left paddle collision
		if (currentLeft - ball.clientWidth / 2 < paddle1.offsetLeft + paddle1.clientWidth &&
			currentTop + ball.clientHeight / 2 > paddle1Top &&
			currentTop + ball.clientHeight / 2 < paddle1Top + paddle1.clientHeight) {
			// Calculate the angle based on the paddle hit position
			const bounceAngle = (currentTop + ball.clientHeight / 2 < paddle1Top + paddle1.clientHeight / 2)
				? -Math.PI / 4
				: Math.PI / 4; // Adjust the angle multiplier as needed

			ballSpeedX = -ballSpeedX;
			ballSpeedY = Math.sign(ballSpeedY) * Math.abs(ballSpeedX) * Math.sin(bounceAngle);

			ball.style.left = `${paddle1.offsetLeft + paddle1.clientWidth + ball.clientWidth}px`;
			paddle1.classList.add('bg-danger'); // Change the paddle's color to red

			setTimeout(function () {
				paddle1.classList.remove('bg-danger'); // Remove the color change after 500ms
			}, 500);
		}

		if (currentTop + ball.clientHeight / 2 > board.clientHeight) {
			ball.style.top = `${board.clientHeight - ball.clientHeight}px`;
			ballSpeedY = -ballSpeedY;
		} else if (currentTop - ball.clientHeight / 2 < 0) {
			ball.style.top = `${10}px`;
			ballSpeedY = -ballSpeedY;
		}

		// Check for scoring
		if (currentLeft <= 0) {
			player2ScoreValue++;
			resetRound();
		} else if (currentLeft >= board.clientWidth - ball.clientWidth) {
			player1ScoreValue++;
			resetRound();
		}

		// Update scores
		player1Score.textContent = player1ScoreValue;
		player2Score.textContent = player2ScoreValue;
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


	function gameLoop(gameState) {
		console.log('gameState:', gameState);
		if (keys.ArrowUp) {
			// Move the second paddle up
			const top = parseInt(paddle2.style.top) || 0;
			paddle2.style.top = `${Math.max(top - paddleSpeed, 0)}px`;
		}
		if (keys.ArrowDown) {
			// Move the second paddle down
			const top = parseInt(paddle2.style.top) || 0;
			paddle2.style.top = `${Math.min(top + paddleSpeed, board.clientHeight - paddle2.clientHeight)}px`;
		}
		if (keys.KeyW) {
			// Move the first paddle up
			const top = parseInt(paddle1.style.top) || 0;
			paddle1.style.top = `${Math.max(top - paddleSpeed, 0)}px`;
		}
		if (keys.KeyS) {
			// Move the first paddle down
			const top = parseInt(paddle1.style.top) || 0;
			paddle1.style.top = `${Math.min(top + paddleSpeed, board.clientHeight - paddle1.clientHeight)}px`;
		}
		updateBallPosition();
		animationFrameId = requestAnimationFrame(gameLoop);
		if (player1ScoreValue == 3) {
			message.textContent = 'Player 1 Wins!';
			isGameRunning = false;
			startGameBtn.style.display = 'block';
			stopGame();
			resetRound();
		}
		else if (player2ScoreValue == 3) {
			message.textContent = 'Player 2 Wins!';
			isGameRunning = false;
			startGameBtn.style.display = 'block';
			stopGame();
			resetRound();
		}
	}

	function stopGame() {
		clearInterval(timer);
		cancelAnimationFrame(animationFrameId);
		player1ScoreValue = 0;
		player2ScoreValue = 0;
	}

	function gameTimer() {
		time = 30;
		timer = setInterval(function () {
			time--;
			message.textContent = `Time Remaining: ${time}`;
			if (time <= 0) {
				clearInterval(timer);
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
		paddle1.style.top = `${board.clientHeight / 2 - paddle1.clientHeight / 2}px`;
		paddle2.style.top = `${board.clientHeight / 2 - paddle2.clientHeight / 2}px`;
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
					if (data.start_game) {
						console.log('Starting the game...');
						console.log('Joined room name:', data.room_name);
						window.room_name = data.room_name;
						socket = new WebSocket('ws://localhost:8000/ws/game/' + data.room_name + '/');
						socket.onopen = function (event) {
							socket.onmessage = function (event) {
								gameState = JSON.parse(event.data).message;
								console.log('gameState:', gameState);
								gameTimer();
								gameLoop(gameState);
							};
						};
						// gameLoop();
					} else {
						console.log('Waiting for another player...');
						console.log('Created room:', data.room_name);
						window.room_name = data.room_name;
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
		setTimeout(function () {
			clearInterval(gameLoop);
			if (player1ScoreValue > player2ScoreValue) {
				message.textContent = 'Player 1 Wins!';
			}
			else if (player2ScoreValue > player1ScoreValue) {
				message.textContent = 'Player 2 Wins!';
			}
			else {
				message.textContent = 'Tie Game!';
			}
			isGameRunning = false;
			startGameBtn.style.display = 'block';
			stopGame();
			resetRound();
		}, 30000);
	}

	function getCookie(name) {
		if (document.cookie && typeof document.cookie === 'string') {
			const cookieValue = document.cookie
				.split('; ')
				.find(row => row.startsWith(name + '='))
				?.split('=')[1];
			return cookieValue ? decodeURIComponent(cookieValue) : null;
		} else {
			console.error('Document cookie is not a valid string:', document.cookie);
			return null;
		}
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
					console.log('Successfully cancelled room');
				} else {
					console.log('Failed to cancel room', data);
				}
			})
			.catch(error => {
				console.error('There has been a problem with your fetch operation:', error);
			});
	}

	paddle1.style.top = `${board.clientHeight / 2 - paddle1.clientHeight / 2}px`;
	paddle2.style.top = `${board.clientHeight / 2 - paddle2.clientHeight / 2}px`;
	resetRound();
});