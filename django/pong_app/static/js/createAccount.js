document.addEventListener('DOMContentLoaded', function () {
	console.log('createAccount.js loaded');
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
	else{
		console.log('User is not logged in');
		isLogged = false;
	}

	createAccountForm.addEventListener('submit', function (event) {
		console.log('createAccountForm submitted');
		event.preventDefault();
		var accountName = document.getElementById('accountName').value;
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
					// add id to user object
					data.id = data.idName;
					sessionStorage.setItem('user', JSON.stringify(data));
					user = JSON.parse(sessionStorage.getItem('user')); 
					user.id = data.idName;
					loginLogout.innerHTML = 'Logout';
					normalLogin.style.display = 'none';
					userName.innerHTML = data.login;
					userImage.src = data.image;
					userImage.style.display = 'block';
					window.location.href = '/homePage/';
				}
			})
			.catch(error => console.error('Error:', error));
	}
	);
});
