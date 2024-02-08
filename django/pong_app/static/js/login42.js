document.addEventListener('DOMContentLoaded', function () {
	var isLogged;
	var existingUser = false;
	var loginLogout = document.getElementById('Login_Logout');
	var normalLogin = document.getElementById('normalLogin');
	var userName = document.getElementById('userName');
	var userImage = document.getElementById('userImage');

	var user = JSON.parse(sessionStorage.getItem('user'));
	var users = JSON.parse(sessionStorage.getItem('users')) || [];
	var jwtToken;

	if (user) {
		fetch('/get_user/' + user.idName + '/')
			.then(response => {
				if (!response.ok) {
					// If the response status is not ok, get the response text and throw an error
					sessionStorage.removeItem('user');
					window.location.href = '/homePage/';
					
				}
				return response.json();
			})
			.then(data => {
				if (data.user) {
					jwtToken = sessionStorage.getItem('jwt');
				} else {
					console.log('User does not exist');
					sessionStorage.removeItem('user');
					window.location.href = '/homePage/';
				}
			});
	}
	function setUserOnline(userId) {
		fetch('/set_user_online/' + userId + '/', {
			method: 'GET',
			headers: {
				'Content-Type': 'application/json',
				'X-CSRFToken': csrfToken,
				'Authorization': `Bearer ${jwtToken}`
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
					console.log('User set online successfully');
				}
			})
			.catch(error => console.error('Error:', error));
	}
	function setUserOffline(userId) {
		fetch('/set_user_offline/' + userId + '/', {
			method: 'GET',
			headers: {
				'Content-Type': 'application/json',
				'X-CSRFToken': csrfToken,
				'Authorization': `Bearer ${jwtToken}`
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
					console.log('User set offline successfully');
				}
			})
			.catch(error => console.error('Error:', error));
	}

	function disconnectUser() {
		var user = JSON.parse(sessionStorage.getItem('user'));
		if (user) {
			setUserOffline(user.id);
			sessionStorage.removeItem('user');
		}
	}

	function isUserLoggedIn() {
		var user = JSON.parse(sessionStorage.getItem('user'));
		return user !== null;
	}

	function show2FAConfirmationPopup() {

		var codeInput;
		var confirmationModal = document.createElement('div');
		confirmationModal.style.position = 'fixed';
		confirmationModal.style.top = '50%';
		confirmationModal.style.left = '50%';
		confirmationModal.style.transform = 'translate(-50%, -50%)';
		confirmationModal.style.backgroundColor = '#151718';
		confirmationModal.style.padding = '20px';
		confirmationModal.style.zIndex = '1000';
		confirmationModal.innerHTML = `
			<div>
				<label for="codeInput">Enter 2FA Code:</label>
				<input type="text" id="codeInput" name="codeInput" style="width: 200px;">
			</div>
			<button id="confirm2FAButton" class="yellow-btn">Confirm</button>
		`;
		document.body.appendChild(confirmationModal);
	
		codeInput = document.getElementById('codeInput');
	
		document.getElementById('confirm2FAButton').addEventListener('click', function () {
			var user = JSON.parse(sessionStorage.getItem('user'));
			userId = user.idName;
			var enteredCode = codeInput.value;
			// Perform AJAX request to confirm 2FA code on the server
			fetch(`/confirm_2fa/${userId}/`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					'X-CSRFToken': csrfToken,
					'Authorization': `Bearer ${jwtToken}`
				},
				body: JSON.stringify({
					'code': enteredCode
				})
			}).then(function (response) {
				return response.json();
			}).then(function (data) {
				if (data.status === 'success') {
					setUserOnline(userId);
					// Redirect to /settings
					window.location.href = '/homePage';
				}
				else {
					console.log('Error confirming 2FA setup:', data);
				}
			}).catch(function (error) {
				console.log('Error confirming 2FA setup:', error);
			});
		});
	
		document.addEventListener('click', function removeConfirmationModal() {
			confirmationModal.remove();
			document.removeEventListener('click', removeConfirmationModal);
		});
	
		confirmationModal.addEventListener('click', function (event) {
			event.stopPropagation();
		});
	}
	
	if (isUserLoggedIn()) {
		var user = JSON.parse(sessionStorage.getItem('user'));
		fetch('/get_user/' + user.idName + '/')
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
					userImage.src = data.user.image;
					user.image = data.user.image;
					userName.innerHTML = data.user.login;
					userImage.style.display = 'block';
					setUserOnline(user.idName);
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
		loginLogout.innerHTML = 'Logout';
		isLogged = true;
		normalLogin.style.display = 'none';
		userName.innerHTML = user.login;
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
			<form id="loginForm">
				<div>
					<label for="username">Username:</label>
					<input type="text" id="username" name="username" autocomplete="username" style="width:  200px;">
				</div>
				<div>
					<label for="password">Password:</label>
					<input type="password" id="password" name="password" autocomplete="current-password" style="width:   200px;">
				</div>
				<button type="submit" id="loginButton" class="yellow-btn">Login</button>
				<button type="button" id="createAccountButton" class="yellow-btn">Create Account</button>
			</form>
		`;
		document.body.appendChild(loginModal);
		document.getElementById('username').focus();
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
						try{
							data.user.id = data.user.idName;
							sessionStorage.setItem('user', JSON.stringify(data.user));
							sessionStorage.setItem('jwt', data.access_token);
							user = JSON.parse(sessionStorage.getItem('user')); // Update the user variable
							user.id = data.user.idName;
							user.idName = data.user.idName;
							sessionStorage.setItem('user', JSON.stringify(user));
							if (data.user.is_2fa_enabled) {
								show2FAConfirmationPopup();
							}
							loginLogout.innerHTML = 'Logout';
							normalLogin.style.display = 'none';
							userName.innerHTML = data.user.login;
							userImage.src = data.user.image;
							setUserOnline(data.user.id);
							userImage.style.display = 'block';
							loginModal.remove();
							// location.reload();
						}
						catch(error){
							console.log('Error:', error);
						}
					}
				})
				.catch(error => {
					console.error('Error:', error);
				});
		});

		document.getElementById('createAccountButton').addEventListener('click', function () {
			window.location.href = '/createAccount';
		});

		document.getElementById('loginForm').addEventListener('submit', function (event) {
			event.preventDefault(); // Prevent the default form submission
			var username = document.getElementById('username').value;
			var password = document.getElementById('password').value;
			// ... rest of your login logic
		});

		document.addEventListener('click', function removeModal() {
			loginModal.remove();
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
			disconnectUser();
			normalLogin.style.display = 'block';
			userName.innerHTML = '';
			isLogged = false;
			userImage.src = '';
			userImage.style.display = 'none';
		} else {
			var user = JSON.parse(sessionStorage.getItem('user'));
			if (user) {
				isLogged = true;
				console.log('User is already logged in HAHA');
			} else {
				fetch('/get_client_id/')
					.then(response => {
						if (!response.ok) {
							throw new Error(`HTTP error! status: ${response.status}, text: ${response.statusText}`);
						}
						return response.json();
					})
					.then(data => {
						var clientId = data.client_id;
						var redirectUri = 'https://localhost:8443/homePage/';
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
		var redirectUri = 'https://localhost:8443/homePage/';
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
						var userUrl = 'https://localhost:8443/proxy/';
						var userXhr = new XMLHttpRequest();
						userXhr.open('GET', userUrl, true);
						userXhr.setRequestHeader('Authorization', 'Bearer ' + accessToken);
						userXhr.onreadystatechange = function () {
							if (this.readyState === 4 && this.status === 200) {
								var user = JSON.parse(this.responseText);
								setUserOnline(user.id);

								var data = {
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
								};
								fetch('/save_user_profile_42/', {
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
											loginLogout.innerHTML = 'Logout';
											userName.innerHTML = data.login;
											normalLogin.style.display = 'none';
											data.id = data.idName;
											if (data.id === undefined) {
												data.id = data.user.idName;
											}
											sessionStorage.setItem('user', data.user);
											sessionStorage.setItem('jwt', data.access_token);
											accessToken = sessionStorage.getItem('jwt');
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
														data.user.id = data.user.idName;
														userImage.src = data.user.image;
														user.image = data.user.image;
														userName.innerHTML = data.user.login;
														userImage.style.display = 'block';
														sessionStorage.setItem('user', JSON.stringify(data.user));
														if (data.user.is_2fa_enabled) {
															show2FAConfirmationPopup();
														}
													}
												})
												.catch(error => console.error('Error:', error));
											isLogged = true;
										}
									})
									.catch((error) => {
										console.error('Error:', error);
									});
								var userXhr = new XMLHttpRequest();
								// console log user
								userXhr.open('GET', '/get_user/' + data.idName + '/', true);
								userXhr.onload = function () {
									if (userXhr.status === 200) {
										var user = JSON.parse(userXhr.responseText);
										userName.innerHTML = user.login;
										userImage.src = user.image;
										userImage.style.display = 'block';
										user.id = user.idName;
										sessionStorage.setItem('user', JSON.stringify(user));
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
		// check if 2fa is enabled if it is show 2fa code input and confirm button
		window.history.pushState({}, null, '/homePage/');
		isLogged = true;
	}

	window.addEventListener('beforeunload', function (event) {
		// check for 2fa
		var user = JSON.parse(sessionStorage.getItem('user'));
		if (!user) {
			return;
		}
		if (user.idName === undefined) {
			user.idName = user.id;
		}
		userId = user.idName;
		// check if this works
		var userXhr = new XMLHttpRequest();
		userXhr.open('GET', '/get_user/' + userId + '/', true);
		userXhr.onload = function () {
			if (userXhr.status === 200) {
				var user = JSON.parse(userXhr.responseText);
				if (user.is_2fa_enabled && !user.is_2fa_logged) {
					disconnectUser();
				}
			}
		};
	});
});
