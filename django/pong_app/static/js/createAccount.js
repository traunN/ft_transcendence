document.addEventListener('DOMContentLoaded', initializeCreateAccount);

function initializeCreateAccount() {
	var loginLogout = document.getElementById('Login_Logout');
	var normalLogin = document.getElementById('normalLogin');
	var userName = document.getElementById('userName');
	var userImage = document.getElementById('userImage');
	var user = JSON.parse(sessionStorage.getItem('user'));
	var createAccountForm = document.getElementById('createAccountForm');
	var isLogged;

	function validatePassword(password) {
		var regex = /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{8,}$/;
		return regex.test(password);
	}

	function isUserLoggedIn() {
		var user = JSON.parse(sessionStorage.getItem('user'));
		return user !== null;
	}

	if (isUserLoggedIn()) {
		console.log('User infos: ' + JSON.stringify(user));
		loginLogout.innerHTML = 'Logout';
		isLogged = true;
	}
	else {
		console.log('User is not logged in');
		isLogged = false;
	}

	function isAlphaNumeric(input) {
		var regex = /^[a-z0-9]+$/i;
		return regex.test(input);
	}

	createAccountForm.addEventListener('submit', function (event) {
		console.log('createAccountForm submitted');
		event.preventDefault();
		var accountName = document.getElementById('accountName').value;
		if (!isAlphaNumeric(accountName)) {
			alert("Account Name must contain only alphanumeric characters (letters A-Z, a-z, and digits 0-9)");
			event.preventDefault();
			return;
		}
		var login = document.getElementById('login').value;
		var password = document.getElementById('password').value;
		var passwordConfirm = document.getElementById('passwordConfirm').value;
		if (password !== passwordConfirm) {
			alert("Passwords do not match");
			return;
		}
		if (!validatePassword(password)) {
			event.preventDefault();
			alert("Password must contain at least one number, one uppercase and lowercase letter, and at least 8 characters");
			return;
		}
		var email = document.getElementById('email').value;
		var data = {
			accountName: accountName,
			login: login,
			password: password,
			email: email
		};
		fetch('/save_user_profile_manual/', {
			method: 'POST',
			body: JSON.stringify(data),
			headers: {
				'Content-Type': 'application/json',
				'X-CSRFToken': csrfToken,
			}
		})
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
					user = JSON.stringify(data.user);
					data.id = data.idName;
					if (data.id === undefined) {
						data.id = data.user.idName;
					}
					sessionStorage.setItem('jwt', data.access_token);
					sessionStorage.setItem('user', JSON.stringify(data.user));
					fetch('/get_user/' + data.id + '/')
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
								console.log('User data: ' + JSON.stringify(data));
								data.user.id = data.user.idName;
								userImage.src = data.user.image;
								user.image = data.user.image;
								userName.innerHTML = data.user.login;
								userImage.style.display = 'block';
								sessionStorage.setItem('user', JSON.stringify(data.user));
							}
						})
						.catch(error => console.error('Error:', error));
					loginLogout.innerHTML = 'Logout';
					normalLogin.style.display = 'none';
					userName.innerHTML = data.login;
					userImage.src = data.image;
					userImage.style.display = 'block';
					navigateToCustompath('/homePage/');
				}
			})
			.catch(error => console.error('Error:', error));
	}
	);
}
