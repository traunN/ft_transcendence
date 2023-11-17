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
	let animationFrameId;

	function updateBallPosition() {
		const currentLeft = parseInt(getComputedStyle(ball).left);
		const currentTop = parseInt(getComputedStyle(ball).top);
		const paddle1Top = parseInt(getComputedStyle(paddle1).top);
		const paddle2Top = parseInt(getComputedStyle(paddle2).top);

		// Update ball position based on speed
		ball.style.left = `${currentLeft + ballSpeedX}px`;
		ball.style.top = `${currentTop + ballSpeedY}px`;

		// Check for right paddle collision
		if (currentLeft + ball.clientWidth / 2 > paddle2.offsetLeft && currentTop + ball.clientHeight / 2 > paddle2Top && currentTop + ball.clientHeight / 2 < paddle2Top + paddle2.clientHeight) {
			// Calculate the angle based on the paddle hit position
			const bounceAngle = (currentTop + ball.clientHeight / 2 < paddle2Top + paddle2.clientHeight / 2) ? -Math.PI / 4 : Math.PI / 4; // Adjust the angle multiplier as needed
		   
			ballSpeedX = -ballSpeedX;
			ballSpeedY = Math.sign(ballSpeedY) * Math.abs(ballSpeedX) * Math.sin(bounceAngle);
		   
			ball.style.left = `${paddle2.offsetLeft - ball.clientWidth}px`;
		}
		
		// Check for left paddle collision
		if (currentLeft - ball.clientWidth / 2 < paddle1.offsetLeft + paddle1.clientWidth && currentTop + ball.clientHeight / 2 > paddle1Top && currentTop + ball.clientHeight / 2 < paddle1Top + paddle1.clientHeight) {
		// Calculate the angle based on the paddle hit position
			const bounceAngle = (currentTop + ball.clientHeight / 2 < paddle1Top + paddle1.clientHeight / 2) ? -Math.PI / 4 : Math.PI / 4; // Adjust the angle multiplier as needed
			
			ballSpeedX = -ballSpeedX;
			ballSpeedY = Math.sign(ballSpeedY) * Math.abs(ballSpeedX) * Math.sin(bounceAngle);
			
			ball.style.left = `${paddle1.offsetLeft + paddle1.clientWidth + ball.clientWidth}px`;
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
		switch (event.key) {
			case 'ArrowUp':
				let newPaddle2Top = parseInt(paddle2.style.top) - paddleSpeed;
				if (newPaddle2Top >= 0) {
					paddle2.style.top = `${newPaddle2Top}px`;
				}
				else{
					paddle2.style.top = `${0}px`;
				}
				break;
			case 'ArrowDown':
				let newPaddle2Bottom = parseInt(paddle2.style.top) + paddleSpeed + paddle2.clientHeight;
				if (newPaddle2Bottom <= board.clientHeight) {
					paddle2.style.top = `${parseInt(paddle2.style.top) + paddleSpeed}px`;
				}
				else {
					paddle2.style.top = `${board.clientHeight - paddle2.clientHeight}px`;
				}
				break;
			case 'w':
				let newPaddle1Top = parseInt(paddle1.style.top) - paddleSpeed;
				if (newPaddle1Top >= 0) {
					paddle1.style.top = `${newPaddle1Top}px`;
				}
				else{
					paddle1.style.top = `${0}px`;
				}
				break;
			case 's':
				let newPaddle1Bottom = parseInt(paddle1.style.top) + paddleSpeed + paddle1.clientHeight;
				if (newPaddle1Bottom <= board.clientHeight) {
					paddle1.style.top = `${parseInt(paddle1.style.top) + paddleSpeed}px`;
				}
				else {
					paddle1.style.top = `${board.clientHeight - paddle1.clientHeight}px`;
				}
				break;
			case 'Enter':
				startGame();
				break;
		}
	});
	

	function stopGame() {
		
		cancelAnimationFrame(animationFrameId);
	}

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
			let time = 30;
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
			animationFrameId = requestAnimationFrame(gameLoop);
		}
		gameLoop();
		setTimeout(function () {
			clearInterval(gameLoop);
			message.textContent = 'Game Over';
			isGameRunning = false;
			startGameBtn.style.display = 'block';
			stopGame();
			resetRound();
		}, 30000);
	}

	// Initial setup
	paddle1.style.top = `${board.clientHeight / 2 - paddle1.clientHeight / 2}px`;
	paddle2.style.top = `${board.clientHeight / 2 - paddle2.clientHeight / 2}px`;
	resetRound();
});