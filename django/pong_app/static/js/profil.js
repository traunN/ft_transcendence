document.addEventListener('DOMContentLoaded', function () {
	var username = document.getElementById('usernameProfil');
	var userImage = document.getElementById('userImageProfil');
	var userEmail = document.getElementById('emailProfil');
	var userFirstName = document.getElementById('firstNameProfil');
	var userLastName = document.getElementById('lastNameProfil');
	var usercampusProfil = document.getElementById('campusProfil');
	var userLevel = document.getElementById('levelProfil');
	var userWallet = document.getElementById('walletProfil');
	var userCorrectionPoint = document.getElementById('correctionPointProfil');
	var userLocation = document.getElementById('locationProfil');


	var user = JSON.parse(sessionStorage.getItem('user'));
	if (user) {
		username.textContent = user.login;
		userImage.src = user.image.link;
		userEmail.textContent = 'Email: ' + user.email;
		userFirstName.textContent = 'First name: ' + user.first_name;
		userLastName.textContent = 'Last name: ' + user.last_name;
		usercampusProfil.textContent = 'Campus: ' + user.campus[0].name;
		userLevel.textContent = 'Level: ' + user.cursus_users[0].level;
		userWallet.textContent = 'Wallet: ' + user.wallet;
		userCorrectionPoint.textContent = 'Correction point: ' + user.correction_point;
		userLocation.textContent = 'Location: ' + user.location;
	} else {
		console.log('No user');
	}
 });
 