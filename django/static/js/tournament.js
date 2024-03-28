document.addEventListener('DOMContentLoaded', function () {
	document.removeEventListener('DOMContentLoaded', initializeTournament);
	document.addEventListener('DOMContentLoaded', initializeTournament);
	initializeTournament();
});

window.tournamentData = {
	socket: null,
	user: JSON.parse(sessionStorage.getItem('user')),
};



function initializeTournament() {
	function isOpen(socket) {
		return socket && socket.readyState === 1;
	}
	const form = document.getElementById('create-tournament-form');
	var user = window.tournamentData.user;
	var ip = window.location.hostname;
	window.tournamentData.socket = new WebSocket('wss://' + ip + ':8443/ws/tournament/');
	window.tournamentData.socket.onopen = function () {
		refreshTournamentList();
	}

	window.tournamentData.socket.onmessage = function (e) {
		var data = JSON.parse(e.data);
		if (data.type === 'tournament_updated') {
			refreshTournamentList();
		}
	};

	form.addEventListener('submit', function (event) {
		event.preventDefault();
		if (!user) {
			alert('Please login');
			return;
		}
		const formData = new FormData(form);
		formData.append('user_id', user.idName);
		formData.append('tournament_name', form.elements['tournament-name'].value);
		var object = {};
		formData.forEach(function (value, key) {
			object[key] = value;
		});

		getJwtFromCookie().then(jwtToken => {
			var json = JSON.stringify(object);
			fetch('/create_tournament/', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					'X-CSRFToken': csrfToken,
					'Authorization': `Bearer ${jwtToken}`
				},
				body: json
			})
				.then(response => response.text())
				.then(data => {
					var response = JSON.parse(data);
					if (response.status === 'success') {
						if (isOpen(window.tournamentData.socket)) {
							window.tournamentData.socket.send(JSON.stringify({
								'type': 'tournament_updated',
							}));
						}
						sessionStorage.setItem('tournamentLobbyKey', response.tournament_id);
						navigateToCustompath('/tournament_lobby/' + response.tournament_id);
					}
					else {
						console.log('Error creating tournament');
						console.log(response);
					}
				})
				.catch(error => console.error(error));
		}
		).catch(error => {
			console.log('Error getting jwt token');
		});
	});

	function joinTournament(tournamentId) {
		if (!user) {
			alert('Please login');
			return;
		}
		const formData = new FormData();
		formData.append('tournament_id', tournamentId);
		getJwtFromCookie().then(jwtToken => {
			fetch('/join_tournament/' + user.idName + '/', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					'X-CSRFToken': csrfToken,
					'Authorization': `Bearer ${jwtToken}`
				},
				body: JSON.stringify(Object.fromEntries(formData))
			})
				.then(response => response.text())
				.then(data => {
					var response = JSON.parse(data);
					var response = JSON.parse(data);
					if (response.status === 'success') {
						if (isOpen(window.tournamentData.socketsocket)) {
							window.tournamentData.socketsocket.send(JSON.stringify({
								'type': 'tournament_updated',
							}));
						}
						sessionStorage.setItem('tournamentLobbyKey', response.tournament_id);
						navigateToCustompath('/tournament_lobby/' + response.tournament_id);
					}
					else {
						console.log(response);
					}
				})
				.catch(error => console.error(error));
		}
		).catch(error => {
			console.log('Error getting jwt token');
		});
	}

	function refreshTournamentList() {
		var table = document.getElementById('tournament-list');
		var tbody = table.getElementsByTagName('tbody')[0];
		tbody.innerHTML = '';

		fetch('/available_tournaments/', {
			method: 'GET',
			headers: {
				'Content-Type': 'application/json',
				'X-CSRFToken': csrfToken,
			},
		})
			.then(response => response.json())
			.then(data => {
				if (data && data.tournaments && data.tournaments.length > 0) {
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
				else if (data && data.tournaments.length === 0) {
					var table = document.getElementById('tournament-list');
					var tbody = table.getElementsByTagName('tbody')[0];
					var message = document.createElement('div');
					message.textContent = 'No tournaments available.';
					message.style.fontFamily = 'Arial, sans-serif';
					message.style.textShadow = '1px 1px 1px #000';
					message.style.fontSize = '24px';
					message.style.textAlign = 'center';
					message.style.marginTop = '20px';
					tbody.appendChild(message);
				}

			})
			.catch(error => console.error(error));
	}
}

window.addEventListener('beforeunload', customOnBeforeUnload);

function customOnBeforeUnload() {
	window.removeEventListener('beforeunload', customOnBeforeUnload);
	if (window.tournamentData.socket.readyState === 1) {
		window.tournamentData.socket.close();
	}
}
