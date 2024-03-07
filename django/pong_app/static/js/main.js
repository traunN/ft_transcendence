
document.addEventListener('DOMContentLoaded', initializePongGame);

window.gameData = {
	shouldCloseSocket: false,
	socket: null
};

function initializePongGame() {
	let isGameRunning = false;
	let justReload = false;
	let gameSocket = window.gameData.socket;
	let userId;
	const board = document.querySelector('.board');
	const paddle1 = document.querySelector('.paddle_1');
	const paddle2 = document.querySelector('.paddle_2');
	const ball = document.querySelector('.ball');
	const player1Score = document.querySelector('.player_1_score');
	const player2Score = document.querySelector('.player_2_score');
	const message = document.querySelector('.message');
	var boardSkin = sessionStorage.getItem('boardSkin') || 'defaultSkin';
	var ballSkin = sessionStorage.getItem('ballSkin') || 'defaultSkin';
	var paddleSkin = sessionStorage.getItem('paddleSkin') || 'defaultSkin';
	var jwtToken;

	if (boardSkin === 'defaultSkin') {
		board.classList.add('blackSkin');
	} else {
		board.classList.add(boardSkin);
	}
	ball.classList.add(ballSkin);
	paddle1.classList.add(paddleSkin);
	paddle2.classList.add(paddleSkin);
	board.classList.add(boardSkin);
	let user = JSON.parse(sessionStorage.getItem('user'));
	if (!user) {
		startGameBtn.textContent = 'Please login';
		return;
	}
	else {
		startGameBtn.textContent = 'Start Game';
		jwtToken = sessionStorage.getItem('jwt');
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
		gameSocket.send(JSON.stringify({ 'message': 'paddle_update_lol', 'paddle': 'paddle1', 'position': JSON.stringify({ 'x': 10, 'y': targetPaddle1Y }) }));
	}

	function update_paddle2_position(updated_paddle_position) {
		const paddlePositionObj = JSON.parse(updated_paddle_position);
		const y = paddlePositionObj.y;
		targetPaddle2Y = y;
		paddle2.style.top = `${y}px`;
		gameSocket.send(JSON.stringify({ 'message': 'paddle_update_lol', 'paddle': 'paddle2', 'position': JSON.stringify({ 'x': 790, 'y': targetPaddle2Y }) }));
	}


	document.getElementById("startGameBtn").addEventListener("click", startGame);

	document.addEventListener('keydown', handleKeyEvent);
	document.addEventListener('keyup', handleKeyEvent);

	function handleKeyEvent(event) {
		if (event.type === 'keydown') {
			keys[event.code] = true;
		} else if (event.type === 'keyup') {
			keys[event.code] = false;
		}
	}

	function update_paddles() {
		if (keys.ArrowUp) {
			targetPaddle2Y -= 10;
			if (targetPaddle2Y < 50) {
				targetPaddle2Y = 50;
			}
			gameSocket.send(JSON.stringify({ 'message': 'paddle_update', 'paddle': 'paddle2', 'position': JSON.stringify({ 'x': 790, 'y': targetPaddle2Y }) }));
		}
		if (keys.ArrowDown) {
			targetPaddle2Y += 10;
			if (targetPaddle2Y > 550) {
				targetPaddle2Y = 550;
			}
			gameSocket.send(JSON.stringify({ 'message': 'paddle_update', 'paddle': 'paddle2', 'position': JSON.stringify({ 'x': 790, 'y': targetPaddle2Y }) }));
		}
		if (keys.KeyW) {
			targetPaddle1Y -= 10;
			if (targetPaddle1Y < 50) {
				targetPaddle1Y = 50;
			}
			gameSocket.send(JSON.stringify({ 'message': 'paddle_update', 'paddle': 'paddle1', 'position': JSON.stringify({ 'x': 10, 'y': targetPaddle1Y }) }));
		}
		if (keys.KeyS) {
			targetPaddle1Y += 10;
			if (targetPaddle1Y > 550) {
				targetPaddle1Y = 550;
			}
			gameSocket.send(JSON.stringify({ 'message': 'paddle_update', 'paddle': 'paddle1', 'position': JSON.stringify({ 'x': 10, 'y': targetPaddle1Y }) }));
		}

		paddle1Y += (targetPaddle1Y - paddle1Y) * interpolationFactor;
		paddle2Y += (targetPaddle2Y - paddle2Y) * interpolationFactor;
		paddle1.style.top = `${paddle1Y}px`;
		paddle2.style.top = `${paddle2Y}px`;

		requestAnimationFrame(update_paddles);
	}

	function gameLoop(gameState) {
		gameSocket.onmessage = function (event) {
			const messageData = JSON.parse(event.data);
			if (messageData.message === 'start_game') {
				const initialState = messageData.initial_state;
				setInterval(gameLoop, 1000 / 60, initialState);
			}
			else if (messageData.message === 'ball_update') {
				const updated_ball_position = messageData.ball_position;
				if (isGameRunning)
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
					var XHR = new XMLHttpRequest();
					XHR.open('GET', '/pongGame/', true);
					XHR.onload = function () {
						if (XHR.status === 200) {
							var parser = new DOMParser();
							var doc = parser.parseFromString(XHR.responseText, 'text/html');
							var newContent = doc.querySelector('#scrollable-area').innerHTML;
							document.getElementById('scrollable-area').innerHTML = newContent;
							customOnBeforeUnload();
							initializePongGame();
						} else {
							console.error('Failed to load new page content');
						}
					};
					XHR.send();
				}, 5000);
				isGameRunning = false;
				if (player1ScoreValue > player2ScoreValue) {
					let winner = document.querySelector('.player_1_name').textContent;
					message.textContent = winner + ' wins!';
				}
				else {
					let winner = document.querySelector('.player_2_name').textContent;
					message.textContent = winner + ' wins!';
				}
			}
			else if (messageData.message === 'cancel_game_room') {
				isGameRunning = false;
				message.textContent = 'Player left the game';
				justReload = true;
				setTimeout(function () {
					var XHR = new XMLHttpRequest();
					XHR.open('GET', '/pongGame/', true);
					XHR.onload = function () {
						if (XHR.status === 200) {
							var parser = new DOMParser();
							var doc = parser.parseFromString(XHR.responseText, 'text/html');
							var newContent = doc.querySelector('#scrollable-area').innerHTML;
							document.getElementById('scrollable-area').innerHTML = newContent;
							customOnBeforeUnload();
							initializePongGame();
						} else {
							console.error('Failed to load new page content');
						}
					};
					XHR.send();
				}, 3000);
			}
			else {
				const gameState = messageData.message;
			}
		};

		update_paddles();
		gameSocket.onclose = function (event) {
			isGameRunning = false;
		};
	}

	function displayNames(player1NameValue, player2NameValue) {
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
		startGameBtn.style.display = 'none';
		isGameRunning = true;
		if (!user.id) {
			return;
		}
		let userId = user.id;
		fetch(`/join_or_create_room/${userId}/`, {
			method: 'GET',
			headers: {
				'Content-Type': 'application/json',
				'X-CSRFToken': csrfToken,
				'Authorization': `Bearer ${jwtToken}`
			}
		})
			.then(response => {
				if (!response.ok) {
					throw new Error('Network response was not ok');
				}
				return response.json();
			})
			.then(data => {
				if (data.status === 'success') {
					gameSocket = new WebSocket('wss://localhost:8443/ws/game/' + data.room_name + '/' + user.id + '/');
					if (!gameSocket) {
						console.log('Failed to create socket');
						return;
					}
					window.gameData.socket = gameSocket;
					if (data.start_game) {
						window.room_name = data.room_name;
						gameSocket.onopen = async function (event) {
							sessionStorage.setItem('shouldCloseSocket', 'true');
							gameSocket.send(JSON.stringify({ 'message': 'start_game' }));
							gameSocket.onmessage = function (event) {
								const messageData = JSON.parse(event.data);
								if (messageData.message === 'start_game') {
									message.textContent = '';
									const user1 = messageData.user1;
									const user2 = messageData.user2;
									displayNames(user1, user2);
									const initialState = messageData.initial_state;
									gameLoop(initialState);
								} else {
									gameState = messageData.message;
								}

							};
						};
					} else {
						message.textContent = 'Waiting for another player...';
						window.room_name = data.room_name;
						gameSocket.onopen = function (event) {
							sessionStorage.setItem('shouldCloseSocket', 'true');
							gameSocket.onmessage = function (event) {
								const messageData = JSON.parse(event.data);
								if (messageData.message === 'start_game') {
									message.textContent = '';
									const user1 = messageData.user1;
									const user2 = messageData.user2;
									displayNames(user1, user2);
									const initialState = messageData.initial_state;
									gameLoop(initialState);
								} else {
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

}
window.addEventListener('beforeunload', customOnBeforeUnload);

function customOnBeforeUnload() {
	window.removeEventListener('beforeunload', customOnBeforeUnload);
	if (window.location.pathname !== '/pongGame/') {
		console.log('not on pongGame');
		return;
	}
	if (sessionStorage.getItem('shouldCloseSocket') === 'true') {
		console.log('onbeforeunload socket');
		console.log('socket is :', window.gameData.socket)
		if (window.gameData.socket) {
			window.gameData.socket.send(JSON.stringify({ 'message': 'cancel_game_room' }));
			window.gameData.socket.close();
		}
		sessionStorage.setItem('shouldCloseSocket', 'false');
	}
}
