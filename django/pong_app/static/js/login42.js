document.addEventListener('DOMContentLoaded', function () {
	var isLogged = false;
	var existingUser = false;
	var loginLogout = document.getElementById('Login_Logout');
	var userName = document.getElementById('userName');
	var userImage = document.getElementById('userImage');

	var user = JSON.parse(sessionStorage.getItem('user'));
	var users = JSON.parse(sessionStorage.getItem('users')) || [];

	if (user) {
		for (var i = 0; i < users.length; i++) {
			if (users[i].login === user.login) {
				existingUser = true;
				break;
			}
		}
	}
	if (user) {
		isLogged = true;
		loginLogout.innerHTML = 'Logout';
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
		userName.innerHTML = '';
		userImage.src = '';
		userImage.style.display = 'none';
	}

	document.getElementById("Login_Logout").addEventListener("click", function () {
		if (isLogged) {
			loginLogout.innerHTML = 'Login with 42';
			isLogged = false;
			sessionStorage.removeItem('user');
			userName.innerHTML = '';
			userImage.src = '';
			userImage.style.display = 'none';
		} else {
			var user = JSON.parse(sessionStorage.getItem('user'));
			if (user) {
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
								userName.innerHTML = user.login;
								userImage.src = user.image.link;
								userImage.style.display = 'block';
							}
						};
						userXhr.send();
						loginLogout.innerHTML = 'Logout';
						isLogged = true;
					}).catch((error) => {
						console.error('Error:', error);
					});
			} catch (error) {
				console.error('Error:', error);
			}
		}
		getClientData();
	} else {
		if (user) {
			console.log('already logged in');
		} else {
			console.log('not logged in');
		}
	}

});