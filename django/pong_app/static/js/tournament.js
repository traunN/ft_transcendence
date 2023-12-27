
document.addEventListener('DOMContentLoaded', function () {
	console.log('tournament.js loaded');

	const socket = new WebSocket('ws://' + window.location.host + '/ws/tournament/');

	function isOpen(ws) {
		return ws.readyState === ws.OPEN;
	}
	socket.onmessage = function (e) {
		var data = JSON.parse(e.data);
		if (data.type === 'tournament_updated') {
			// just refresh for other users
			location.reload();
		}
	};
	const form = document.getElementById('create-tournament-form');

	// Add an event listener for the form submission
	form.addEventListener('submit', function (event) {
		event.preventDefault();

		const formData = new FormData(form);
		var user = JSON.parse(sessionStorage.getItem('user'));
		formData.append('user_id', user.id);
		formData.append('tournament_name', form.elements['tournament-name'].value);
		// Convert FormData to plain JavaScript object
		var object = {};
		formData.forEach(function (value, key) {
			object[key] = value;
		});

		// Convert JavaScript object to JSON string
		var json = JSON.stringify(object);

		fetch('/create_tournament/', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				'X-CSRFToken': csrfToken,
			},
			body: json
		})
			.then(response => response.text())
			.then(data => {
				console.log(data);
				// Redirect to the tournament lobby page
				var response = JSON.parse(data);
				if (response.status === 'success') {
					// Send a message to the tournament lobby group
					if (isOpen(socket)) {
						socket.send(JSON.stringify({
							'type': 'tournament_updated',
						}));
					}
					window.location.href = '/tournament_lobby/' + response.tournament_id;
				}
				else {
					console.log('Error creating tournament');
					console.log(response);
				}
			})
			.catch(error => console.error(error));

	});

	window.onbeforeunload = function () {
		// if socket is open, close it
		socket.close();
	}

	function joinTournament(tournamentId) {
		const formData = new FormData();
		var user = JSON.parse(sessionStorage.getItem('user'));
		formData.append('tournament_id', tournamentId);

		fetch('/join_tournament/' + user.id + '/', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				'X-CSRFToken': csrfToken,
			},
			body: JSON.stringify(Object.fromEntries(formData))
		})
			.then(response => response.text())
			.then(data => {
				var response = JSON.parse(data);
				var response = JSON.parse(data);
				if (response.status === 'success') {
					// Send a message to the tournament lobby group
					if (isOpen(socket)) {
						socket.send(JSON.stringify({
							'type': 'tournament_updated',
						}));
					}
					window.location.href = '/tournament_lobby/' + response.tournament_id;
				}
				else {
					console.log('Error joining tournament');
					console.log(response);
				}
			})
			.catch(error => console.error(error));
	}


	fetch('/available_tournaments/', {
		method: 'GET',
		headers: {
			'Content-Type': 'application/json',
			'X-CSRFToken': csrfToken,
		},
	})
		.then(response => response.json())
		.then(data => {
			if (data && data.tournaments) {
				var tournaments = data.tournaments;
				var table = document.getElementById('tournament-list');
				var tbody = table.getElementsByTagName('tbody')[0];
				for (var i = 0; i < tournaments.length; i++) {
					var row = tbody.insertRow(0);
					var tournamentName = row.insertCell(0);
					var tournamentStatus = row.insertCell(1);
					var tournamentPlayerCount = row.insertCell(2);
					var tournamentJoin = row.insertCell(3);
					if (tournaments[i].name.length > 20) {
						tournamentName.innerHTML = tournaments[i].name.substring(0, 20) + '...';
					}
					else {
						tournamentName.innerHTML = tournaments[i].name;
					}
					tournamentStatus.innerHTML = tournaments[i].status;
					tournamentPlayerCount.innerHTML = tournaments[i].count + '/4';
					if (tournaments[i].status === 'available') {
						tournamentJoin.innerHTML = '<button class="join-button-style button-style" data-tournament-id="' + tournaments[i].id + '">Join</button>';
						tournamentStatus.style.color = '#00ff00';
						var joinButtons = document.getElementsByClassName('join-button-style');
						for (var j = 0; j < joinButtons.length; j++) {
							joinButtons[j].addEventListener('click', function (e) {
								var tournamentId = e.target.dataset.tournamentId;
								joinTournament(tournamentId);
							});
						}
					}
					else {
						tournamentStatus.style.color = 'red';
					}
				}
			}
			else {
				console.log('no tournaments available');
				console.log(data);
			}
		})
		.catch(error => console.error(error));
});