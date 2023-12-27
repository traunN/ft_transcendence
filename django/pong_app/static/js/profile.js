var username = document.getElementById('usernameProfile');
var userImage = document.getElementById('userImageProfile');
var userInfo = document.getElementById('userInfo');
var userEmail = document.getElementById('emailProfile');
var userFirstName = document.getElementById('firstNameProfile');
var userLastName = document.getElementById('lastNameProfile');
var usercampusProfile = document.getElementById('campusProfile');
var userLevel = document.getElementById('levelProfile');
var userWallet = document.getElementById('walletProfile');
var userCorrectionPoint = document.getElementById('correctionPointProfile');
var userLocation = document.getElementById('locationProfile');
var searchUser = document.getElementById('searchUser');

var user = JSON.parse(sessionStorage.getItem('user'));

document.addEventListener('DOMContentLoaded', function () {
	if (!user) {
		username.textContent = 'Please login';
		userInfo.style.display = 'none';
		userImage.style.display = 'none';
		return;
	}
	var userId = user.id;
	console.log('userId: ' + userId);
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
			userImage.src = data.user.image;
		})
		.catch(error => {
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
				userImage.src = data.user.image;
			})
			.catch(error => {
				console.error('Error:', error);
			});
	}
});
