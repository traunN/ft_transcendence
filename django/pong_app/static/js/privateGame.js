
document.addEventListener('DOMContentLoaded', initializePrivateGame);

window.privateGameData = {
	shouldCloseSocket: false,
	socket: null
};

function initializePrivateGame() {
	let isGameRunning = false;
	let userId;
	let gameSocket = window.privateGameData.socket;
	let isWinner = false;
	let gameRoomStarted = false;
	let justReload = false;
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
	var user = JSON.parse(sessionStorage.getItem('user'));
	if (!user) {
		console.log('Failed to get user from session storage');
		history.back();
		return;
	}
	else {
		console.log('user:', user);
	}
	if (roomNameKey) {
		if (roomNameKey !== roomName) {
			sessionStorage.setItem('roomNameKey', '');
			history.back();
		}
	}
	else {
		sessionStorage.setItem('roomNameKey', '');
		history.back();
	}
	jwtToken = sessionStorage.getItem('jwt');

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
		if (!isGameRunning) {
			console.log('gameLoop not running');
			return;
		}
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
				isGameRunning = false;
				if (player1ScoreValue > player2ScoreValue) {
					message.textContent = 'Player 1 wins!';
				}
				else {
					message.textContent = 'Player 2 wins!';
				}
			}
			else if (messageData.message === 'cancel_game_room') {
				isGameRunning = false;
				message.textContent = 'Player left the game';
				sessionStorage.setItem('roomNameKey', '');
				justReload = true;
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
		if (!user.id) {
			console.log('Please login');
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
					console.log('Successfully joined or created room');
					gameSocket = new WebSocket('wss://localhost:8443/ws/game/' + data.room_name + '/' + user.id + '/');
					window.privateGameData.socket = gameSocket;
					if (!gameSocket) {
						console.log('Failed to create socket');
						return;
					}
					gameRoomStarted = true;
					if (data.start_game) {
						window.room_name = data.room_name;
						// check if both players are in the same room
						gameSocket.onopen = async function (event) {
							sessionStorage.setItem('shouldCloseSocket', 'true');
							gameSocket.send(JSON.stringify({ 'message': 'start_game' }));
							gameSocket.onmessage = function (event) {
								const messageData = JSON.parse(event.data);
								if (messageData.message === 'start_game') {
									isGameRunning = true;
									message.textContent = '';
									const user1 = messageData.user1;
									const user2 = messageData.user2;
									displayNames(user1, user2);
									// Handle the initial game state
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
									// Handle the initial game state
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
	if (!window.location.href.includes('privateGame')) {
		console.log('not on privateGame');
		return;
	}
	if (sessionStorage.getItem('shouldCloseSocket') === 'true') {
		console.log('socket is :', window.privateGameData.socket)
		if (window.privateGameData.socket) {
			window.privateGameData.socket.send(JSON.stringify({ 'message': 'cancel_game_room' }));
			window.privateGameData.socket.close();
			console.log('Closing the socket');
		}
		sessionStorage.setItem('shouldCloseSocket', 'false');
	}
}

