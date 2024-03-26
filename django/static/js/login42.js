document.addEventListener('DOMContentLoaded', initializeLogin);

window.getJwtFromCookie = function () {
	return fetch('/get_jwt_token/', {
		method: 'GET',
		credentials: 'include',
		headers: {
			'Content-Type': 'application/json',
		}
	})
		.then(response => {
			if (!response.ok) {
				return null;
			}
			return response.json();
		})
		.then(data => {
			if (data && data.jwt) {
				return data.jwt;
			} else {
				return null;
			}
		})
		.catch(error => {
			return null;
		});
};

function initializeLogin() {
	var isLogged;
	var loginLogout = document.getElementById('Login_Logout');
	var normalLogin = document.getElementById('normalLogin');
	var userName = document.getElementById('userName');
	var userImage = document.getElementById('userImage');

	var user = JSON.parse(sessionStorage.getItem('user'));
	userImage.style.opacity = '0';
	userImage.onload = function () {
		userImage.style.opacity = '1';
	};
	if (user) {
		getJwtFromCookie().then(jwtToken => {
			if (!jwtToken) {
				disconnectUser();
			}
		}).catch(error => {
			disconnectUser();
		});
		fetch('/get_user/' + user.idName + '/')
			.then(response => {
				if (!response.ok) {
					disconnectUser();
				}
				return response.json();
			})
			.then(data => {
				if (data.user) {
					if (data.user.is_2fa_enabled && !data.user.is_2fa_logged) {
						disconnectUser();
					}
				} else {
					disconnectUser();
				}
			});
	}
	else {
		getJwtFromCookie().then(jwtToken => {
			if (!jwtToken) {
				if (user) {
					disconnectUser();
				}
			}
			else {
				fetch('/get_user_by_jwt/', {
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
						if (data.user) {
							user = data.user;
							user.id = data.user.idName;
							user.idName = data.user.idName;
							sessionStorage.setItem('user', JSON.stringify(user));
							loginLogout.innerHTML = 'Logout';
							normalLogin.style.display = 'none';
							userName.innerHTML = data.user.login;
							userImage.src = data.user.image;
							userImage.style.display = 'block';
							isLogged = true;
						}
					})
					.catch(error => {
						console.error('Error:', error);
					});
			}
		}).catch(error => {
		}
		);
	}

	function setUserOnline(userId, retries = 3) {
		getJwtFromCookie().then(jwtToken => {
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
					// Handle the data
				})
				.catch(error => {
					if (retries > 0) {
						console.error('Error:', error);
						console.log('Retrying...');
						setUserOnline(userId, retries - 1);
					} else {
						console.error('Failed after retries:', error);
					}
				});
		}).catch(error => {
			console.error('Error getting JWT:', error);
		});
	}

	function setUserOffline(userId, retries = 3) {
		getJwtFromCookie().then(jwtToken => {
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
				})
				.catch(error => {
					if (retries > 0) {
						console.error('Error:', error);
						console.log('Retrying...');
						setUserOnline(userId, retries - 1);
					} else {
						console.error('Failed after retries:', error);
					}
				});
		}).catch(error => {
			console.error('Error getting JWT:', error);
		});
	}

	function disconnectUser() {
		loginLogout.innerHTML = 'Login with 42';
		var user = JSON.parse(sessionStorage.getItem('user'));
		if (user) {
			setUserOffline(user.id);
			sessionStorage.removeItem('user');
		}
		normalLogin.style.display = 'block';
		userName.innerHTML = '';
		isLogged = false;
		userImage.src = '';
		userImage.style.display = 'none';
		removeJwtCookie();
		navigateToCustompath('/homePage/');
	}

	function removeJwtCookie() {
		fetch('/remove_jwt_token/', {
			method: 'GET',
			credentials: 'include',
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
			})
			.catch(error => console.error('Error:', error));
	}

	function isUserLoggedIn() {
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
		document.getElementById('codeInput').focus();

		document.getElementById('confirm2FAButton').addEventListener('click', function () {
			var user = JSON.parse(sessionStorage.getItem('user'));
			userId = user.idName;
			var enteredCode = codeInput.value;
			getJwtFromCookie().then(jwtToken => {
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
						navigateToCustompath('/homePage/');
					}
					else {
						console.log('Error confirming 2FA setup:', data);
					}
				}).catch(function (error) {
					console.log('Error confirming 2FA setup:', error);
				});
			}
			).catch(error => {
				console.error('Error:', error);
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
		loginLogout.innerHTML = 'Logout';
		normalLogin.style.display = 'none';
		userImage.src = user.image;
		userName.innerHTML = user.login;
		userImage.style.display = 'block';
		isLogged = true;
	} else {
		normalLogin.style.display = 'block';
		userImage.src = '';
		userName.innerHTML = '';
		userImage.style.display = 'none';
		isLogged = false;
	}

	document.getElementById('normalLogin').addEventListener('click', function (event) {
		event.preventDefault();
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
					<input type="text" id="username" name="username" autocomplete="username" style="width: 200px;">
				</div>
				<div>
					<label for="password">Password:</label>
					<input type="password" id="password" name="password" autocomplete="current-password" style="width: 200px;">
				</div>
				<button type="submit" id="loginButton" class="yellow-btn">Login</button>
				<button type="button" id="createAccountButton" class="yellow-btn">Create Account</button>
			</form>
		`;
		loginModal.addEventListener('submit', function (event) {
			event.preventDefault();
		});
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
						return response.text().then(text => {
							throw new Error('Server error: ' + text);
						});
					}
					return response.json();
				})
				.then(data => {
					if (data.status === 'success') {
						try {
							data.user.id = data.user.idName;
							sessionStorage.setItem('user', JSON.stringify(data.user));
							user = JSON.parse(sessionStorage.getItem('user'));
							if (data.user.is_2fa_enabled) {
								user.id = data.user.idName;
								user.idName = data.user.idName;
								sessionStorage.setItem('user', JSON.stringify(user));
								loginModal.remove();
								show2FAConfirmationPopup();
							}
							else
							{
								user.id = data.user.idName;
								user.idName = data.user.idName;
								sessionStorage.setItem('user', JSON.stringify(user));
								loginModal.remove();
								navigateToCustompath('/homePage/');
							}
						}
						catch (error) {
							console.log('Error:', error);
						}
					}
					else {
						password = document.getElementById('password');
						password.style.outline = 'none';
						password.style.border = '1px solid red';
						password.style.borderRadius = '5px';
						password.value = '';
						password.placeholder = 'Invalid password';
						password.focus();
					}
				})
				.catch(error => {
					console.error('Error:', error);
				});
		});

		document.getElementById('createAccountButton').addEventListener('click', function () {
			navigateToCustompath('/createAccount/');
		});

		document.addEventListener('click', function removeModal() {
			loginModal.remove();
			document.removeEventListener('click', removeModal);
		});

		loginModal.addEventListener('click', function (event) {
			event.stopPropagation();
		});
	});

	document.getElementById("Login_Logout").addEventListener("click", function (event) {
		event.preventDefault();
		if (isLogged) {
			disconnectUser();
		} else {
			if (user) {
				isLogged = true;
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
									data.user.id = data.user.idName;
									if (data.user.id === undefined) {
										data.user.id = data.user.idName;
									}
									sessionStorage.setItem('user', data.user);
									accessToken = getJwtFromCookie();
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
		window.history.pushState({}, document.title, '/homePage/');
		isLogged = true;
	}

	window.addEventListener('beforeunload', function (event) {
		var user = JSON.parse(sessionStorage.getItem('user'));
		if (!user) {
			return;
		}
		if (user.idName === undefined) {
			user.idName = user.id;
		}
		userId = user.idName;
		if (userId === undefined) {
			return;
		}
	});
}
