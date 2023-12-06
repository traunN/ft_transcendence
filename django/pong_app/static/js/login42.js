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
		userImage.src = user.image.link;
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
		}
		else {
			var clientId = 'u-s4t2ud-7c5080717dbb44d8ad2439acf51e0d576db8aaf6f49ef1866fc422e96ca86dd2';
			var redirectUri = 'http://localhost:8000/homePage/';
			var url = 'https://api.intra.42.fr/oauth/authorize?client_id=' + clientId + '&redirect_uri=' + redirectUri + '&response_type=code';
			window.location.href = url;
		}
	});

	var code = new URLSearchParams(window.location.search).get('code');
	if (code) {
		var clientId = 'u-s4t2ud-7c5080717dbb44d8ad2439acf51e0d576db8aaf6f49ef1866fc422e96ca86dd2';
		var clientSecret = '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';
		var redirectUri = 'http://localhost:8000/homePage/';
		var xhr = new XMLHttpRequest();
		xhr.open('POST', 'https://api.intra.42.fr/oauth/token', true);
		xhr.onreadystatechange = function () {
			if (this.readyState === 4 && this.status === 200) {
				var response = JSON.parse(this.responseText);
				var accessToken = response.access_token;
				var userUrl = 'https://api.intra.42.fr/v2/me';
				var userXhr = new XMLHttpRequest();
				userXhr.open('GET', userUrl, true);
				userXhr.setRequestHeader('Authorization', 'Bearer ' + accessToken);
				userXhr.onreadystatechange = function () {
					if (this.readyState === 4 && this.status === 200) {
						var user = JSON.parse(this.responseText);
						console.log(user)
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
						xhrSaveProfile.send(JSON.stringify({
							login: user.login,
							email: user.email,
							firstName: user.first_name,
							lastName: user.last_name,
							image: user.image.link,
							campus: user.campus[0].name,
							level: user.cursus_users[0].level,
							wallet: user.wallet,
							correctionPoint: user.correction_point,
							location: user.location,
							idName: user.id
						}));
						userName.innerHTML = user.login;
						userImage.src = user.image.link;
						userImage.style.display = 'block';
					}
				};
				userXhr.send();
				loginLogout.innerHTML = 'Logout';
			}
		};
		if (!user) {
			var data = 'grant_type=authorization_code&client_id=' + clientId + '&client_secret=' + clientSecret + '&code=' + code + '&redirect_uri=' + redirectUri;
			xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
			xhr.send(data);
			isLogged = true;
			loginLogout.innerHTML = 'Login with 42';
		}
		else
			console.log('user already logged in');
	}
	else {
		if (user)
		{
			console.log('already logged in');
			console.log(user);
		}
		else
			console.log('not logged in');
	}
});