let isGameRunning = false;

document.addEventListener('DOMContentLoaded', function () {
	const board = document.querySelector('.board');
	const paddle1 = document.querySelector('.paddle_1');
	const paddle2 = document.querySelector('.paddle_2');
	const ball = document.querySelector('.ball');
	const player1Score = document.querySelector('.player_1_score');
	const player2Score = document.querySelector('.player_2_score');
	const message = document.querySelector('.message');

	let paddleSpeed = 7;
	let ballSpeedX = 4;
	let ballSpeedY = 4;
	let player1ScoreValue = 0;
	let player2ScoreValue = 0;

	function updateBallPosition() {
		const currentLeft = parseInt(getComputedStyle(ball).left);
		const currentTop = parseInt(getComputedStyle(ball).top);

		// Update ball position based on speed
		ball.style.left = `${currentLeft + ballSpeedX}px`;
		ball.style.top = `${currentTop + ballSpeedY}px`;

		if (currentLeft + ball.clientWidth / 2 > paddle2.offsetLeft && currentTop + ball.clientHeight / 2 > paddle2.offsetTop && currentTop + ball.clientHeight / 2 < paddle2.offsetTop + paddle2.clientHeight) {
			ballSpeedX = -ballSpeedX;
			ball.style.left = `${paddle2.offsetLeft - ball.clientWidth}px`;
		}
		// also check for left side
		if (currentLeft + ball.clientWidth / 2 < paddle1.offsetLeft + paddle1.clientWidth && currentTop + ball.clientHeight / 2 > paddle1.offsetTop && currentTop + ball.clientHeight / 2 < paddle1.offsetTop + paddle1.clientHeight) {
			ballSpeedX = -ballSpeedX;
			ball.style.left = `${paddle1.offsetLeft + paddle1.clientWidth}px`;
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
			resetGame();
		} else if (currentLeft >= board.clientWidth - ball.clientWidth) {
			player1ScoreValue++;
			resetGame();
		}

		// Update scores
		player1Score.textContent = player1ScoreValue;
		player2Score.textContent = player2ScoreValue;
	}

	function resetGame() {
		// Reset ball position
		ball.style.left = `${board.clientWidth / 2 - ball.clientWidth / 2}px`;
		ball.style.top = `${board.clientHeight / 2 - ball.clientHeight / 2}px`;

		// Reset paddle positions
		
	}

	document.getElementById("startGameBtn").addEventListener("click", startGame);

	
	document.addEventListener('keydown', function(event) {
		switch (event.key) {
		case 'ArrowUp':
			paddle2.style.top = `${parseInt(paddle2.style.top) - paddleSpeed}px`;
			break;
			case 'ArrowDown':
				paddle2.style.top = `${parseInt(paddle2.style.top) + paddleSpeed}px`;
				break;
		case 'w':
			paddle1.style.top = `${parseInt(paddle1.style.top) - paddleSpeed}px`;
			break;
			case 's':
				paddle1.style.top = `${parseInt(paddle1.style.top) + paddleSpeed}px`;
				break;
				case 'Enter':
					startGame();
					break;
				}
			});
			
			
			function startGame() {
				// Hide message
				if (isGameRunning) {
					return;
		}
		message.textContent = '';
		
		startGameBtn.style.display = 'none';
		
		isGameRunning = true;
		paddle1.style.top = `${board.clientHeight / 2 - paddle1.clientHeight / 2}px`;
		paddle2.style.top = `${board.clientHeight / 2 - paddle2.clientHeight / 2}px`;
		function gameTimer() {
			let time = 60;
			const timer = setInterval(function () {
				time--;
				message.textContent = `Time Remaining: ${time}`;
				if (time <= 0) {
					clearInterval(timer);
				}
			}, 1000);
		}
		gameTimer();
		// Start the game loop
		function gameLoop() {
			updateBallPosition();
			requestAnimationFrame(gameLoop);
		}
		gameLoop();

		// Listen for keydown events
		// Listen for keyup events to stop paddles
		// Listen for keyup events to stop paddles
		// Stop the game loop after 60 seconds
		setTimeout(function () {
			clearInterval(gameLoop);
			message.textContent = 'Game Over';
			isGameRunning = false;
		}, 60000);
	}

	// Initial setup
	resetGame();
});