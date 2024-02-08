document.addEventListener('DOMContentLoaded', function () {
	fetch('/get_all_users/')
		.then(response => response.json())
		.then(data => {
			if (data) {
				console.log(data);
			}
			var users = data.users;
			if (data.users.length === 0) {
				return;
			}
			users.sort((a, b) => b.wins - a.wins);
			var table = document.getElementById('leaderboard');
			for (var i = 0; i < users.length; i++) {
				var row = table.insertRow(i + 1);
				var rank = row.insertCell(0);
				var login = row.insertCell(1);
				var wins = row.insertCell(2);
				var loses = row.insertCell(3);
				var winrate = row.insertCell(4);
				var tourney_wins = row.insertCell(5);
				rank.innerHTML = i + 1;
				login.innerHTML = users[i].login;
				wins.innerHTML = users[i].wins;
				loses.innerHTML = users[i].loses;
				var totalGames = users[i].wins + users[i].loses;
				var winrateValue = 0;
				if (totalGames > 0) {
					winrateValue = Math.round(users[i].wins / totalGames * 100);
				}
				winrate.innerHTML = winrateValue + '%';
				tourney_wins.innerHTML = users[i].tournamentWins;
			}
		});
});