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

var user = JSON.parse(sessionStorage.getItem('user'));

document.addEventListener('DOMContentLoaded', function () {
	if (!user) {
		username.textContent = 'Please login';
		userInfo.style.display = 'none';
		userImage.style.display = 'none';
		return;
	}
	var pathArray = window.location.pathname.split('/');
	var userId = pathArray[pathArray.length - 2];
	if (pathArray[pathArray.length - 2] === 'profile' && pathArray[pathArray.length - 1] === '') {
		userId = user.idName;
	}
	fetch('/get_user/' + userId + '/')
		.then(response => {
			if (!response.ok) {
				// If the response status is not ok, get the response text and throw an error
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
			userAccountName.style.display = 'block';
			userAccountName.textContent = 'Account name: ' + data.user.idName;

			fetch('/get_user_game_history/' + userId + '/')
				.then(response => {
					if (!response.ok) {
						// If the response status is not ok, get the response text and throw an error
						return response.text().then(text => {
							throw new Error('Server error: ' + text);
						});
					}
					return response.json();
				})
				.then(data => {
					if (data.games) {
						console.log(data);
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
});

document.getElementById('editProfileButton').addEventListener('click', function () {
	// Replace static text with input fields
	username.innerHTML = `<input type="text" id="usernameInput" value="${username.textContent}">`;
	userEmail.innerHTML = `<input type="text" id="emailInput" value="${userEmail.textContent.slice(7)}">`;
	userFirstName.innerHTML = `<input type="text" id="firstNameInput" value="${userFirstName.textContent.slice(12)}">`;
	userLastName.innerHTML = `<input type="text" id="lastNameInput" value="${userLastName.textContent.slice(11)}">`;
	usercampusProfile.innerHTML = `<input type="text" id="campusInput" value="${usercampusProfile.textContent.slice(8)}">`;
	var imageInput = document.createElement('input');
	imageInput.type = 'file';
	imageInput.id = 'imageInput';
	userImageProfile.parentNode.insertBefore(imageInput, userImageProfile.nextSibling);
});

document.getElementById('saveProfileButton').addEventListener('click', function () {
	// Get the new values from the input fields
	var newUsername = document.getElementById('usernameInput').value;
	var newEmail = document.getElementById('emailInput').value;
	var newFirstName = document.getElementById('firstNameInput').value;
	var newLastName = document.getElementById('lastNameInput').value;
	var newCampus = document.getElementById('campusInput').value;
	var newImage = document.getElementById('imageInput').files[0];

	var formData = new FormData();

	// Append the user data and the image file to the form data
	formData.append('id', user.id);
	formData.append('login', newUsername);
	formData.append('email', newEmail);
	formData.append('firstName', newFirstName);
	formData.append('lastName', newLastName);
	formData.append('campus', newCampus);
	if (newImage) {
		formData.append('image', newImage);
	}
	// Make a fetch request to update the user data on the server
	fetch('/update_user/', {
		method: 'POST',
		headers: {
			'X-CSRFToken': csrfToken,
		},
		body: formData,
	})
		.then(response => response.json())
		.then(data => {
			console.log(data);
			username.textContent = newUsername;
			userEmail.textContent = 'Email: ' + newEmail;
			userFirstName.textContent = 'First name: ' + newFirstName;
			userLastName.textContent = 'Last name: ' + newLastName;
			usercampusProfile.textContent = 'Campus: ' + newCampus;
			// update session storage user login and email
			user.login = newUsername;
			user.email = newEmail;
			user.firstName = newFirstName;
			user.lastName = newLastName;
			user.campus = newCampus;
			sessionStorage.setItem('user', JSON.stringify(user));
			location.reload();
		})
		.catch((error) => {
			console.error('Error:', error);
		});
});

searchUser.addEventListener('keypress', function (event) {
	if (event.key === "Enter") {
		event.preventDefault();
		var userLogin = searchUser.value;
		fetch('/get_user_by_login/' + userLogin + '/')
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
	
			})
			.catch(error => {
				console.error('Error:', error);
			});
	}
});
