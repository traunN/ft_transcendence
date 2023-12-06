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

var user = JSON.parse(sessionStorage.getItem('user'));

document.addEventListener('DOMContentLoaded', function () {
	var userId = user.id;
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
			userImage.src = data.user.image;
			userEmail.textContent = 'Email: ' + data.user.email;
			userFirstName.textContent = 'First name: ' + data.user.firstName;
			userLastName.textContent = 'Last name: ' + data.user.lastName;
			usercampusProfile.textContent = 'Campus: ' + data.user.campus;
			userLevel.textContent = 'Level: ' + data.user.level;
			userWallet.textContent = 'Wallet: ' + data.user.wallet;
			userCorrectionPoint.textContent = 'Correction point: ' + data.user.correctionPoint;
			userLocation.textContent = 'Location: ' + data.user.location;
		})
		.catch(error => {
			console.error('Error:', error);
		});
});


// document.getElementById('searchUser').addEventListener('keyup', function (event) {
// 	var searchValue = this.value.toLowerCase();
// 	var users = JSON.parse(sessionStorage.getItem('users'));
// 	var foundUser;

// 	for (var i = 0; i < users.length; i++) {
// 		if (users[i].login.toLowerCase() === searchValue) {
// 			foundUser = users[i];
// 			break;
// 		}
// 	}

// 	if (event.key === 'Enter') {
// 		if (foundUser) {
// 			username.textContent = foundUser.login;
// 			userImage.src = foundUser.image.link;
// 			userEmail.textContent = 'Email: ' + foundUser.email;
// 			userFirstName.textContent = 'First name: ' + foundUser.first_name;
// 			userLastName.textContent = 'Last name: ' + foundUser.last_name;
// 			usercampusProfile.textContent = 'Campus: ' + foundUser.campus[0].name;
// 			userLevel.textContent = 'Level: ' + foundUser.cursus_users[0].level;
// 			userWallet.textContent = 'Wallet: ' + foundUser.wallet;
// 			userCorrectionPoint.textContent = 'Correction point: ' + foundUser.correction_point;
// 			userLocation.textContent = 'Location: ' + foundUser.location;
// 		} else {
// 			console.log('No user found');
// 		}
// 	}
// });