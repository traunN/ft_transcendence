document.addEventListener('DOMContentLoaded', function () {
	console.log('setup2fa.js loaded');
	// <div id="setup2FAContainer">
	// 	<h2>Setup Two-Factor Authentication</h2>
	// 	<div id="qrCodeContainer">
	// 		<!-- Placeholder for QR code display -->
	// 		<!-- setup_2fa.html -->
	// 		<img src="{{ qr_code_url }}" alt="QR Code">
	// 	</div>
		
	// 	<p>Scan the QR code using your authenticator app.</p>

	// 	<div id="2faCodeContainer">
	// 		<label for="2faCode">Enter the 6-digit code from your authenticator app:</label>
	// 		<input type="text" id="2faCode" name="2faCode" required>
	// 	</div>
	// 	<button id="confirm2FAButton">Confirm 2FA Setup</button>
	// </div>

	// Get the user from session storage
	var user = JSON.parse(sessionStorage.getItem('user'));
	if (!user) {
		console.log('Failed to get user from session storage');
		return;
	}

	// Get the JWT token from session storage
	var jwtToken = sessionStorage.getItem('jwt');
	// Get the setup2FAContainer
	var setup2FAContainer = document.getElementById('setup2FAContainer');
	// Get the confirm2FAButton
	var confirm2FAButton = document.getElementById('confirm2FAButton');
	// Get the 2faCode input
	var twoFactorCode = document.getElementById('2faCode');
	// Add an event listener to the confirm2FAButton
	confirm2FAButton.addEventListener('click', function () {
		// Get the 2faCode value
		var code = twoFactorCode.value;
		// Make a POST request to /confirm_2fa
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

});