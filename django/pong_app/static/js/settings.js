document.addEventListener('DOMContentLoaded', function () {
	console.log('settings.js loaded');

	// Get the saved values from localStorage
	var savedBallSkin = localStorage.getItem('ballSkin');
	var savedPaddleSkin = localStorage.getItem('paddleSkin');

	// Set the selected options in the dropdowns to match the saved values
	if (savedBallSkin) {
		document.getElementById('ballSkin').value = savedBallSkin;
	}
	if (savedPaddleSkin) {
		document.getElementById('paddleSkin').value = savedPaddleSkin;
	}

	document.getElementById('skinSettingsForm').addEventListener('submit', function (e) {
		e.preventDefault();

		var ballSkin = document.getElementById('ballSkin').value;
		var paddleSkin = document.getElementById('paddleSkin').value;

		localStorage.setItem('ballSkin', ballSkin);
		localStorage.setItem('paddleSkin', paddleSkin);

		// Instead of using alert, update the dedicated area for the success message
		document.getElementById('successMessage').style.display = 'block';
	});
});
