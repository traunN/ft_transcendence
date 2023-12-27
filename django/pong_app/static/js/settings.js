document.addEventListener('DOMContentLoaded', function () {
	console.log('settings.js loaded');
	var user = JSON.parse(sessionStorage.getItem('user'));

	// Get the saved values from sessionStorage
	var savedBallSkin = sessionStorage.getItem('ballSkin');
	var savedPaddleSkin = sessionStorage.getItem('paddleSkin');
	var savedBoardSkin = sessionStorage.getItem('boardSkin');

	// Set the selected options in the dropdowns to match the saved values
	if (savedBallSkin) {
		document.getElementById('ballSkin').value = savedBallSkin;
	}
	if (savedPaddleSkin) {
		document.getElementById('paddleSkin').value = savedPaddleSkin;
	}
	if (savedBoardSkin) {
		document.getElementById('boardSkin').value = savedBoardSkin;
	}



	document.getElementById('skinSettingsForm').addEventListener('submit', function (e) {
		e.preventDefault();

		var ballSkin = document.getElementById('ballSkin').value;
		var paddleSkin = document.getElementById('paddleSkin').value;
		var boardSkin = document.getElementById('boardSkin').value;

		sessionStorage.setItem('ballSkin', ballSkin);
		sessionStorage.setItem('paddleSkin', paddleSkin);
		sessionStorage.setItem('boardSkin', boardSkin);

		// Instead of using alert, update the dedicated area for the success message
		document.getElementById('successMessage').style.display = 'block';
	});
	if (!user) {
		document.getElementById('generateUser').style.display = 'block';
		document.getElementById('deleteUser').style.display = 'none';
	}
	else {
		document.getElementById('generateUser').style.display = 'none';
		document.getElementById('deleteUser').style.display = 'block';
	}
	document.getElementById('generateUser').addEventListener('click', generateRandomUser);

	document.getElementById('deleteUser').addEventListener('click', function () {
		sessionStorage.removeItem('user');
		location.reload();
	});

	function generateRandomUser() {
		fetch('/save_test_user/')
			.then(response => {
				if (!response.ok) {
					throw new Error(`HTTP error! status: ${response.status}, text: ${response.statusText}`);
				}
				return response.json();
			})
			.then(data => {
				console.log(data);
				data.id = data.idName;
				sessionStorage.setItem('user', JSON.stringify(data));
				location.reload();
			})
			.catch(error => console.error('Error:', error));
	}
});
