document.addEventListener('DOMContentLoaded', function () {
	console.log('tournament_game.js loaded');
	var user = JSON.parse(sessionStorage.getItem('user'));
	let isLeavingTournament = false;
	var tournamentId = document.getElementById('tournamentId').value;
	var roomName = document.getElementById('roomName').value;
	console.log('tournament id: ' + tournamentId);
	console.log('room name: ' + roomName);

	const pagesocket = new WebSocket('ws://' + window.location.host + '/ws/tournament/');

	const socket = new WebSocket('ws://' + window.location.host + '/ws/tournament_game/' + tournamentId + '/' + roomName + '/');

	socket.onopen = function (event) {
		console.log('Connection opened');
	};

	socket.onerror = function (error) {
		console.error('WebSocket Error: ', error);
	};

	socket.onclose = function (event) {
		if (event.wasClean) {
			console.log(`Connection closed cleanly, code=${event.code} reason=${event.reason}`);
		} else {
			console.log('Connection died');
		}
	};

	// Create a new WebSocket.

	// Function to check if the WebSocket is open
	function isOpen(ws) {
		return ws.readyState === ws.OPEN;
	}

	function sendMessage(message) {
		if (isOpen(socket)) {
			socket.send(JSON.stringify(message));
		}
	}

	window.addEventListener('beforeunload', function (event) {
		if (!isLeavingTournament) {
			const formData = new FormData();
			formData.append('tournament_id', tournamentId);

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
						if (isOpen(pagesocket)) {
							pagesocket.send(JSON.stringify({
								'type': 'tournament_updated',
							}));
							pagesocket.close();
						}
						if (isOpen(socket)) {
							socket.close();
						}
						window.location.href = '/tournament/';
					}
					else {
						console.log('Error leaving tournament');
						console.log(response);
					}
				})
				.catch(error => console.error(error));

			isLeavingTournament = true;
		}
	});

});
