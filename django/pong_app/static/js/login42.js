document.getElementById('loginWith42').addEventListener('click', function() {
	// Step 1: Redirect the user to the 42 API's authorization URL
	var clientId = 'YOUR_CLIENT_ID';
	var redirectUri = encodeURIComponent('YOUR_REDIRECT_URI');
	var url = 'https://api.intra.42.fr/oauth/authorize?client_id=' + clientId + '&redirect_uri=' + redirectUri + '&response_type=code';
	window.location.href = url;
  });
  
  // Step 2: Handle the authorization code in the URL
  var code = new URLSearchParams(window.location.search).get('code');
  if (code) {
	// Step 3: Exchange the authorization code for an access token
	var clientId = 'YOUR_CLIENT_ID';
	var clientSecret = 'YOUR_CLIENT_SECRET';
	var redirectUri = encodeURIComponent('YOUR_REDIRECT_URI');
	var url = 'https://api.intra.42.fr/oauth/token';
	var data = 'grant_type=authorization_code&client_id=' + clientId + '&client_secret=' + clientSecret + '&code=' + code + '&redirect_uri=' + redirectUri;
  
	var xhr = new XMLHttpRequest();
	xhr.open('POST', url, true);
	xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
	xhr.onreadystatechange = function() {
	  if (this.readyState === 4 && this.status === 200) {
		var response = JSON.parse(this.responseText);
		var accessToken = response.access_token;
  
		// You now have an access token, which you can use to make API requests.
		// For example, you can get the user's information:
		var userUrl = 'https://api.intra.42.fr/v2/me';
		var userXhr = new XMLHttpRequest();
		userXhr.open('GET', userUrl, true);
		userXhr.setRequestHeader('Authorization', 'Bearer ' + accessToken);
		userXhr.onreadystatechange = function() {
		  if (this.readyState === 4 && this.status === 200) {
			var user = JSON.parse(this.responseText);
			// Do something with the user's information, like updating the page.
		  }
		};
		userXhr.send();
	  }
	};
	xhr.send(data);
  }