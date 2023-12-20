document.addEventListener('DOMContentLoaded', function () {
	console.log('tournament_lobby.js loaded');

	window.onbeforeunload = function () {
		// Remove the user from the tournament
		var user = JSON.parse(sessionStorage.getItem('user'));
		var tournamentId = document.getElementById('tournamentId').value;

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
				history.back();
			})
			.catch(error => console.error(error));
	}
});
