document.addEventListener('DOMContentLoaded', initializeProfile);

function initializeProfile() {
	var username = document.getElementById('usernameProfile');
	var userImage = document.getElementById('userImageProfile');
	var userImageTopBar = document.getElementById('userImage');
	var userInfo = document.getElementById('userInfo');
	var userEmail = document.getElementById('emailProfile');
	var userFirstName = document.getElementById('firstNameProfile');
	var userLastName = document.getElementById('lastNameProfile');
	var usercampusProfile = document.getElementById('campusProfile');
	var userLevel = document.getElementById('levelProfile');
	var userWallet = document.getElementById('walletProfile');
	var userCorrectionPoint = document.getElementById('correctionPointProfile');
	var userLocation = document.getElementById('locationProfile');
	var userWins = document.getElementById('winsProfile');
	var userLoses = document.getElementById('losesProfile');
	var userTournamentWins = document.getElementById('tournamentWinsProfile');
	var userAccountName = document.getElementById('accountNameProfile');
	var searchUser = document.getElementById('searchUser');
	var gameHistoryCard = document.getElementById('gameHistoryCard');
	var profileCard = document.getElementById('profileCard');
	var pleaseLoginCard = document.getElementById('pleaseLoginCard');
	var user = JSON.parse(sessionStorage.getItem('user'));
	if (!user) {
		profileCard.style.display = 'none';
		gameHistoryCard.style.display = 'none';
		pleaseLoginCard.style.display = 'block';
		return;
	}
	var pathArray = window.location.pathname.split('/');
	var userId = pathArray[pathArray.length - 2];
	if (pathArray[pathArray.length - 3] === 'profile' && pathArray[pathArray.length - 2] === '') {
		userId = user.idName;
	}
	else if (pathArray[pathArray.length - 3] === 'profile' && pathArray[pathArray.length - 2] !== '') {
		userId = pathArray[pathArray.length - 2];
	}
	else {
		userId = user.idName;
	}
	if (userId !== user.idName) {
		document.getElementById('editProfileButton').style.display = 'none';
		document.getElementById('saveProfileButton').style.display = 'none';
		document.getElementById('remove2FA').style.display = 'none';
		document.getElementById('setup2FAButton').style.display = 'none';
	}

	fetch('/get_user/' + userId + '/')
		.then(response => {
			if (!response.ok) {
				return response.text().then(text => {
					throw new Error('Server error: ' + text);
				});
			}
			return response.json();
		})
		.then(data => {
			username.textContent = data.user.login;
			username.textContent = username.textContent.charAt(0).toUpperCase() + username.textContent.slice(1);
			userEmail.textContent = 'Email: ' + data.user.email;
			userFirstName.textContent = 'First name: ' + data.user.firstName;
			userLastName.textContent = 'Last name: ' + data.user.lastName;
			usercampusProfile.textContent = 'Campus: ' + data.user.campus;
			userLevel.textContent = 'Level: ' + data.user.level;
			userWallet.textContent = 'Wallet: ' + data.user.wallet;
			userCorrectionPoint.textContent = 'Correction point: ' + data.user.correctionPoint;
			userLocation.textContent = 'Location: ' + data.user.location;
			userWins.textContent = 'Wins: ' + data.user.wins;
			userLoses.textContent = 'Loses: ' + data.user.loses;
			userTournamentWins.textContent = 'Tournament wins: ' + data.user.tournamentWins;
			userImage.src = data.user.image;
			userImageTopBar.src = data.user.image;
			userImage.addEventListener('load', function () {
				document.getElementById('card-container').classList.add('visible');
			});
			sessionStorage.setItem('user', JSON.stringify(data.user));
			userAccountName.style.display = 'block';
			userAccountName.textContent = 'Account name: ' + data.user.idName;
			if (data.user.is_2fa_enabled && userId == user.idName) {
				document.getElementById('remove2FA').style.display = 'block';
				document.getElementById('setup2FAButton').style.display = 'none';
			}
			else if (!data.user.is_2fa_enabled && userId == user.idName){
				document.getElementById('remove2FA').style.display = 'none';
				document.getElementById('setup2FAButton').style.display = 'block';
			}
			fetch('/get_user_game_history/' + userId + '/')
				.then(response => {
					if (!response.ok) {
						return response.text().then(text => {
							throw new Error('Server error: ' + text);
						});
					}
					return response.json();
				})
				.then(data => {
					if (data.games) {
						if (data.games.length === 0) {
							var gameHistoryDiv = document.getElementById('gameHistory');
							gameHistoryDiv.innerHTML = 'No game history';
						}
						var gameHistoryDiv = document.getElementById('gameHistory');
						data.games.forEach(game => {
							var gameElement = document.createElement('div');
							gameElement.classList.add('card');
							var cardBody = document.createElement('div');
							cardBody.classList.add('card-body');
							var gameDate = document.createElement('p');
							gameDate.classList.add('card-text');
							var date = new Date(game.game_date);
							var year = date.getFullYear();
							var month = date.getMonth() + 1;
							var day = date.getDate();
							if (month < 10) {
								month = '0' + month;
							}
							if (day < 10) {
								day = '0' + day;
							}
							game.game_date = year + '-' + month + '-' + day;
							gameDate.textContent = game.game_date;
							var gamePlayers = document.createElement('h5');
							gamePlayers.classList.add('card-title');
							gamePlayers.textContent = game.player1Login + ' vs ' + game.player2Login;
							var gameScore = document.createElement('p');
							gameScore.classList.add('card-text');
							gameScore.textContent = game.score1 + ' : ' + game.score2;
							cardBody.appendChild(gamePlayers);
							cardBody.appendChild(gameDate);
							cardBody.appendChild(gameScore);
							gameElement.appendChild(cardBody);
							gameHistoryDiv.appendChild(gameElement);
							if (userId == game.winnerId) {
								gameElement.style.backgroundColor = '#4CAF50';
							}
							else {
								gameElement.style.backgroundColor = '#f44336';
							}
						});
					}
				})
				.catch(error => {
					console.error('Error:', error);
				});
		})
		.catch(error => {
			console.error('Error:', error);
			username.textContent = 'Please login';
			userInfo.style.display = 'none';
			userImage.style.display = 'none';
			return;
		});

	document.getElementById('editProfileButton').addEventListener('click', function () {
		username.innerHTML = `<input type="text" id="usernameInput" value="${username.textContent}">`;
		userEmail.innerHTML = `<input type="text" id="emailInput" value="${userEmail.textContent.slice(7)}">`;
		userFirstName.innerHTML = `<input type="text" id="firstNameInput" value="${userFirstName.textContent.slice(12)}">`;
		userLastName.innerHTML = `<input type="text" id="lastNameInput" value="${userLastName.textContent.slice(11)}">`;
		usercampusProfile.innerHTML = `<input type="text" id="campusInput" value="${usercampusProfile.textContent.slice(8)}">`;
		var imageInput = document.createElement('input');
		imageInput.type = 'file';
		imageInput.id = 'imageInput';
		userImageProfile.parentNode.insertBefore(imageInput, userImageProfile.nextSibling);
		document.getElementById('editProfileButton').style.display = 'none';
	});

	document.getElementById('saveProfileButton').addEventListener('click', function () {
		var newUsername = document.getElementById('usernameInput').value;
		var newEmail = document.getElementById('emailInput').value;
		var newFirstName = document.getElementById('firstNameInput').value;
		var newLastName = document.getElementById('lastNameInput').value;
		var newCampus = document.getElementById('campusInput').value;
		var newImage = document.getElementById('imageInput').files[0];

		var formData = new FormData();

		formData.append('id', user.idName);
		formData.append('login', newUsername);
		formData.append('email', newEmail);
		formData.append('firstName', newFirstName);
		formData.append('lastName', newLastName);
		formData.append('campus', newCampus);
		if (newImage) {
			formData.append('image', newImage);
		}
		getJwtFromCookie().then(jwtToken => {
			fetch('/update_user/', {
				method: 'POST',
				headers: {
					'X-CSRFToken': csrfToken,
					'Authorization': `Bearer ${jwtToken}`
				},
				body: formData,
			})
				.then(response => response.json())
				.then(data => {
					if (data.status === 'success') {
						username.textContent = newUsername;
						userEmail.textContent = 'Email: ' + newEmail;
						userFirstName.textContent = 'First name: ' + newFirstName;
						userLastName.textContent = 'Last name: ' + newLastName;
						usercampusProfile.textContent = 'Campus: ' + newCampus;
						user.login = newUsername;
						user.email = newEmail;
						user.firstName = newFirstName;
						user.lastName = newLastName;
						user.campus = newCampus;
						sessionStorage.setItem('user', JSON.stringify(user));
						navigateToCustompath('/profile/' + user.idName);
					}
					else {
						console.log('Error updating user');
						console.log(data);
					}
				})
				.catch((error) => {
					console.error('Error:', error);
				});
		}
		).catch(error => {
			console.error('Error:', error);
		});
	});

	document.getElementById('remove2FA').addEventListener('click', function () {
		userId = user.idName;
		getJwtFromCookie().then(jwtToken => {
			fetch(`/remove_2fa/${userId}/`, {
				method: 'POST',
				headers: {
					'X-CSRFToken': csrfToken,
					'Authorization': `Bearer ${jwtToken}`
				},
			})
				.then(response => response.json())
				.then(data => {
					if (data.status === 'success')
						navigateToCustompath('/profile/' + user.idName);
				})
				.catch(error => {
					console.error('Error:', error);
				});
		}
		).catch(error => {
			console.error('Error:', error);
		});
	});

	document.getElementById('setup2FAButton').addEventListener('click', function () {
		const userId = user.idName;
		const url = `/setup_2fa/${encodeURIComponent(userId)}/`;
		navigateToCustompath(url);
	});

	searchUser.addEventListener('keypress', function (event) {
		if (event.key === "Enter") {
			event.preventDefault();
			var user_id = searchUser.value;
			fetch('/get_user/' + user_id + '/')
				.then(response => {
					if (!response.ok) {
						return response.text().then(text => {
							throw new Error('Server error: ' + text);
						});
					}
					return response.json();
				})
				.then(data => {
					if (data) {
						console.log(data);
					}
					document.getElementById('editProfileButton').style.display = 'none';
					document.getElementById('saveProfileButton').style.display = 'none';
					document.getElementById('remove2FA').style.display = 'none';
					document.getElementById('setup2FAButton').style.display = 'none';
					userInfo.style.display = 'block';
					userImage.style.display = 'block';
					username.textContent = data.user.login;
					username.textContent = username.textContent.charAt(0).toUpperCase() + username.textContent.slice(1);
					userEmail.textContent = 'Email: ' + data.user.email;
					userFirstName.textContent = 'First name: ' + data.user.firstName;
					userLastName.textContent = 'Last name: ' + data.user.lastName;
					usercampusProfile.textContent = 'Campus: ' + data.user.campus;
					userLevel.textContent = 'Level: ' + data.user.level;
					userWallet.textContent = 'Wallet: ' + data.user.wallet;
					userCorrectionPoint.textContent = 'Correction point: ' + data.user.correctionPoint;
					userLocation.textContent = 'Location: ' + data.user.location;
					userWins.textContent = 'Wins: ' + data.user.wins;
					userLoses.textContent = 'Loses: ' + data.user.loses;
					userTournamentWins.textContent = 'Tournament wins: ' + data.user.tournamentWins;
					userImage.src = data.user.image;
					if (!data.user.isFrom42) {
						userAccountName.style.display = 'block';
					}
					else {
						userAccountName.style.display = 'none';
					}
					userAccountName.textContent = 'Account name: ' + data.user.idName;

					fetch('/get_user_game_history/' + data.user.idName + '/')
						.then(response => {
							if (!response.ok) {
								return response.text().then(text => {
									throw new Error('Server error: ' + text);
								});
							}
							return response.json();
						})
						.then(data => {
							if (data.games) {
								var gameHistoryDiv = document.getElementById('gameHistory');
								gameHistoryDiv.innerHTML = '';
								data.games.forEach(game => {
									var gameElement = document.createElement('div');
									gameElement.classList.add('card');
									var cardBody = document.createElement('div');
									cardBody.classList.add('card-body');
									var gameDate = document.createElement('p');
									gameDate.classList.add('card-text');
									var date = new Date(game.game_date);
									var year = date.getFullYear();
									var month = date.getMonth() + 1;
									var day = date.getDate();
									if (month < 10) {
										month = '0' + month;
									}
									if (day < 10) {
										day = '0' + day;
									}
									game.game_date = year + '-' + month + '-' + day;
									gameDate.textContent = game.game_date;
									var gamePlayers = document.createElement('h5');
									gamePlayers.classList.add('card-title');
									gamePlayers.textContent = game.player1Login + ' vs ' + game.player2Login;
									var gameScore = document.createElement('p');
									gameScore.classList.add('card-text');
									gameScore.textContent = game.score1 + ' : ' + game.score2;
									cardBody.appendChild(gamePlayers);
									cardBody.appendChild(gameDate);
									cardBody.appendChild(gameScore);
									gameElement.appendChild(cardBody);
									gameHistoryDiv.appendChild(gameElement);
									if (user_id == game.winnerId) {
										gameElement.style.backgroundColor = '#4CAF50';
									}
									else {
										gameElement.style.backgroundColor = '#f44336';
									}
								});
							}
						})
						.catch(error => {
							console.error('Error:', error);
						});

				})
				.catch(error => {
					console.error('Error:', error);
				});
		}
	});
}
