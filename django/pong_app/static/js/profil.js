var username = document.getElementById('usernameProfil');
var userImage = document.getElementById('userImageProfil');
var userInfo = document.getElementById('userInfo');
var userEmail = document.getElementById('emailProfil');
var userFirstName = document.getElementById('firstNameProfil');
var userLastName = document.getElementById('lastNameProfil');
var usercampusProfil = document.getElementById('campusProfil');
var userLevel = document.getElementById('levelProfil');
var userWallet = document.getElementById('walletProfil');
var userCorrectionPoint = document.getElementById('correctionPointProfil');
var userLocation = document.getElementById('locationProfil');

var user = JSON.parse(sessionStorage.getItem('user'));

document.addEventListener('DOMContentLoaded', function () {
	var userId = user.id;
	fetch('/get_user/' + userId + '/')
		.then(response => response.json())
		.then(data => {
			console.log(data);
			username.textContent = data.user.login;
			userImage.src = data.user.image;
			userEmail.textContent = 'Email: ' + data.user.email;
			userFirstName.textContent = 'First name: ' + data.user.firstName;
			userLastName.textContent = 'Last name: ' + data.user.lastName;
			usercampusProfil.textContent = 'Campus: ' + data.user.campus;
			userLevel.textContent = 'Level: ' + data.user.level;
			userWallet.textContent = 'Wallet: ' + data.user.wallet;
			userCorrectionPoint.textContent = 'Correction point: ' + data.user.correctionPoint;
			userLocation.textContent = 'Location: ' + data.user.location;
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
// 			usercampusProfil.textContent = 'Campus: ' + foundUser.campus[0].name;
// 			userLevel.textContent = 'Level: ' + foundUser.cursus_users[0].level;
// 			userWallet.textContent = 'Wallet: ' + foundUser.wallet;
// 			userCorrectionPoint.textContent = 'Correction point: ' + foundUser.correction_point;
// 			userLocation.textContent = 'Location: ' + foundUser.location;
// 		} else {
// 			console.log('No user found');
// 		}
// 	}
// });