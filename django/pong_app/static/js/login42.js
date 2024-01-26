document.addEventListener('DOMContentLoaded', function () {
	var isLogged;
	var existingUser = false;
	var loginLogout = document.getElementById('Login_Logout');
	var normalLogin = document.getElementById('normalLogin');
	var userName = document.getElementById('userName');
	var userImage = document.getElementById('userImage');

	var user = JSON.parse(sessionStorage.getItem('user'));
	var users = JSON.parse(sessionStorage.getItem('users')) || [];

	function isUserLoggedIn() {
		var user = JSON.parse(sessionStorage.getItem('user'));
		return user !== null;
	}
	if (isUserLoggedIn()) {
		// get user image from database and update sessionstorage
		var user = JSON.parse(sessionStorage.getItem('user'));
		fetch('/get_user/' + user.id + '/')
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
					// set image in sessionstorage
					userImage.src = data.user.image;
					user.image = data.user.image;
					sessionStorage.setItem('user', JSON.stringify(user));
				}
			})
			.catch(error => console.error('Error:', error));
		isLogged = true;
	} else {
		console.log('User is not logged in');
		isLogged = false;
	}
	if (user) {
		for (var i = 0; i < users.length; i++) {
			if (users[i].login === user.login) {
				existingUser = true;
				userName.innerHTML = user.login;
				break;
			}
		}
	}
	if (user) {
		console.log('user login: ' + user.login)
		loginLogout.innerHTML = 'Logout';
		isLogged = true;
		normalLogin.style.display = 'none';
		userName.innerHTML = user.login;
		if (user && user.image) {
			if (typeof user.image === 'object') {
				userImage.src = user.image.link;
			}
			else
				userImage.src = user.image;
		}
		userImage.style.display = 'block';
	}
	else {
		normalLogin.style.display = 'block';
		isLogged = false;
		userName.innerHTML = '';
		userImage.src = '';
		userImage.style.display = 'none';
	}

	document.getElementById('normalLogin').addEventListener('click', function () {
		event.stopPropagation();
		var loginModal = document.createElement('div');
		loginModal.style.position = 'fixed';
		loginModal.style.top = '50%';
		loginModal.style.left = '50%';
		loginModal.style.transform = 'translate(-50%, -50%)';
		loginModal.style.backgroundColor = '#151718';
		loginModal.style.padding = '20px';
		loginModal.style.zIndex = '1000';
		loginModal.innerHTML = `
    <div>
        <label for="username">Username:</label>
        <input type="text" id="username" name="username" style="width: 200px;">
    </div>
    <div>
        <label for="password">Password:</label>
        <input type="password" id="password" name="password" style="width: 200px;">
    </div>
    <button id="loginButton" class="yellow-btn" >Login</button>
    <button id="createAccountButton" class="yellow-btn" >Create Account</button>
`;
		document.body.appendChild(loginModal);

		document.getElementById('loginButton').addEventListener('click', function () {
			var username = document.getElementById('username').value;
			var password = document.getElementById('password').value;
			var data = {
				accountName: username,
				password: password
			};
			fetch('/login_user/', {
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
					if (data.status === 'success') {
						console.log(data);
						data.user.id = data.user.idName;
						console.log('data.user.id: ' + data.user.id);
						sessionStorage.setItem('user', JSON.stringify(data.user));
						user = JSON.parse(sessionStorage.getItem('user')); // Update the user variable
						user.id = data.user.idName;
						console.log('User infos: ' + JSON.stringify(user));
						loginLogout.innerHTML = 'Logout';
						normalLogin.style.display = 'none';
						userName.innerHTML = data.user.login;
						userImage.src = data.user.image;
						userImage.style.display = 'block';
						loginModal.remove();
						location.reload();
					}
					else {
						console.log(data.message);
					}
				})
				.catch(error => {
					console.error('Error:', error);
				});
		});

		document.getElementById('createAccountButton').addEventListener('click', function () {
			// Redirect to account creation page
			window.location.href = '/createAccount';
		});

		document.addEventListener('click', function removeModal() {
			// Remove the modal
			loginModal.remove();
			// Remove this event listener
			document.removeEventListener('click', removeModal);
		});

		loginModal.addEventListener('click', function (event) {
			event.stopPropagation();
		});
	});

	document.getElementById("Login_Logout").addEventListener("click", function () {
		console.log('isLogged: ' + isLogged)
		if (isLogged) {
			loginLogout.innerHTML = 'Login with 42';
			sessionStorage.removeItem('user');
			normalLogin.style.display = 'block';
			userName.innerHTML = '';
			isLogged = false;
			userImage.src = '';
			userImage.style.display = 'none';
		} else {
			var user = JSON.parse(sessionStorage.getItem('user'));
			if (user) {
				isLogged = true;
				console.log('User is already logged in');
			} else {
				fetch('/get_client_id/')
					.then(response => {
						if (!response.ok) {
							throw new Error(`HTTP error! status: ${response.status}, text: ${response.statusText}`);
						}
						return response.json();
					})
					.then(data => {
						isLogged = true;
						var clientId = data.client_id;
						var redirectUri = 'http://localhost:8000/homePage/';
						var url = 'https://api.intra.42.fr/oauth/authorize?client_id=' + clientId + '&redirect_uri=' + redirectUri + '&response_type=code';
						window.location.href = url;
					})
					.catch(error => console.error('Error:', error));
			}
		}
	});

	var code = new URLSearchParams(window.location.search).get('code');
	if (code) {
		var clientId;
		var clientSecret;
		var redirectUri = 'http://localhost:8000/homePage/';
		async function getClientData() {
			try {
				const responseSecret = await fetch('/get_client_secret/');
				const dataSecret = await responseSecret.json();
				clientSecret = dataSecret.client_secret;

				const responseId = await fetch('/get_client_id/');
				const dataId = await responseId.json();
				clientId = dataId.client_id;

				fetch('/exchange_token/?code=' + code)
					.then((response) => {
						if (response.ok) {
							return response.json();
						} else {
							throw new Error('Network response was not ok');
						}
					}).then((data) => {
						var accessToken = data.access_token;
						var userUrl = 'https://api.intra.42.fr/v2/me';
						var userXhr = new XMLHttpRequest();
						userXhr.open('GET', userUrl, true);
						userXhr.setRequestHeader('Authorization', 'Bearer ' + accessToken);
						userXhr.onreadystatechange = function () {
							if (this.readyState === 4 && this.status === 200) {
								var user = JSON.parse(this.responseText);
								sessionStorage.setItem('user', JSON.stringify(user));
								if (!existingUser) {
									users.push(user);
									sessionStorage.setItem('users', JSON.stringify(users));
								}
								var xhrSaveProfile = new XMLHttpRequest();
								xhrSaveProfile.open('POST', '/api/save_user_profile/', true);
								xhrSaveProfile.setRequestHeader('Content-Type', 'application/json');
								xhrSaveProfile.onload = function () {
									if (xhrSaveProfile.status === 200) {
										console.log('Login successful!');
										loginLogout.innerHTML = 'Logout';
										normalLogin.style.display = 'none';
									} else {
										console.error('Error saving user profile:', xhrSaveProfile.statusText);
										if (user) {
											userName.innerHTML = '';
											isLogged = false;
											userImage.style.display = 'none';
											sessionStorage.removeItem('user');
										}
									}
								};
								if (!user.location)
									user.location = 'none';
								xhrSaveProfile.send(JSON.stringify({
									login: user.login,
									email: user.email,
									firstName: user.first_name,
									lastName: user.last_name,
									campus: user.campus[0].name,
									level: user.cursus_users[1].level,
									wallet: user.wallet,
									correctionPoint: user.correction_point,
									location: user.location,
									idName: user.id,
									image: user.image.link
								}));
								// get user infos returned so i can change image in user sessionstorage
								var userXhr = new XMLHttpRequest();
								userXhr.open('GET', '/get_user/' + user.id + '/', true);
								userXhr.onload = function () {
									if (userXhr.status === 200) {
										var user = JSON.parse(userXhr.responseText);
										sessionStorage.setItem('user', JSON.stringify(user));
										userName.innerHTML = user.login;
										userImage.src = user.image.link;
										userImage.style.display = 'block';
									}
								};
							}
						};
						userXhr.onerror = function () {
							console.log('Error');
							if (user) {
								userName.innerHTML = user.login;
								userImage.src = user.image;
								userImage.style.display = 'block';
							}
						};
						userXhr.send();
					}).catch((error) => {
						console.error('Error:', error);
					});
			} catch (error) {
				console.error('Error:', error);
			}
		}
		getClientData();
		window.history.pushState({}, null, '/homePage/');
		isLogged = true;
	} else {
		console.log('No code');
	}

});