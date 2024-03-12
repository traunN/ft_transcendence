document.addEventListener('DOMContentLoaded', initializeSetup2FA);

function initializeSetup2FA() {
	var user = JSON.parse(sessionStorage.getItem('user'));
	if (!user) {
		console.log('Failed to get user from session storage');
		return;
	}

	var jwtToken = sessionStorage.getItem('jwt');
	var setup2FAContainer = document.getElementById('setup2FAContainer');
	var confirm2FAButton = document.getElementById('confirm2FAButton');
	var twoFactorCode = document.getElementById('2faCode');
	twoFactorCode.focus();
	confirm2FAButton.addEventListener('click', function () {
		var code = twoFactorCode.value;
		const userId = user.idName;
		fetch(`/confirm_2fa/${userId}/`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				'X-CSRFToken': csrfToken,
				'Authorization': `Bearer ${jwtToken}`
			},
			body: JSON.stringify({
				'code': code
			})
		}).then(function (response) {
			return response.json();
		}).then(function (data) {
			if (data.status === 'success') {
				navigateToCustompath('/homePage/');
			}
			else {
				console.log('Error confirming 2FA setup:', data);
			}
		}).catch(function (error) {
			console.log('Error confirming 2FA setup:', error);
		});
	});

}