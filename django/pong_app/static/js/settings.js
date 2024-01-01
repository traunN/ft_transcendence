document.addEventListener('DOMContentLoaded', function () {
	console.log('settings.js loaded');
	var user = JSON.parse(sessionStorage.getItem('user'));

	var savedBallSkin = sessionStorage.getItem('ballSkin');
	var savedPaddleSkin = sessionStorage.getItem('paddleSkin');
	var savedBoardSkin = sessionStorage.getItem('boardSkin');
	const ball = document.querySelector('.ball');
	const paddle = document.querySelector('.paddle');
	const board = document.querySelector('.board');

	var boardSkin = sessionStorage.getItem('boardSkin') || 'defaultSkin';
	var ballSkin = sessionStorage.getItem('ballSkin') || 'defaultSkin';
	var paddleSkin = sessionStorage.getItem('paddleSkin') || 'defaultSkin';
	if (boardSkin === 'defaultSkin') {
		board.classList.add('blackSkin');
	} else {
		board.classList.add(boardSkin);
	}

	document.getElementById('ballSkin').addEventListener('change', function () {
		var ballSkin = this.value;
		sessionStorage.setItem('ballSkin', ballSkin);
		ball.className = '';
		location.reload();
	});

	document.getElementById('paddleSkin').addEventListener('change', function () {
		var paddleSkin = this.value;
		sessionStorage.setItem('paddleSkin', paddleSkin);
		paddle.className = '';
		location.reload();
	});

	document.getElementById('boardSkin').addEventListener('change', function () {
		var boardSkin = this.value;
		sessionStorage.setItem('boardSkin', boardSkin);
		board.className = '';
		location.reload();
	});


	ball.classList.add(ballSkin);
	paddle.classList.add(paddleSkin);
	board.classList.add(boardSkin);
	if (savedBallSkin) {
		ball.classList.add(savedBallSkin);
		document.getElementById('ballSkin').value = savedBallSkin;
	} else {
		ball.classList.add('defaultSkin');
	}
 
	if (savedPaddleSkin) {
		paddle.classList.add(savedPaddleSkin);
		document.getElementById('paddleSkin').value = savedPaddleSkin;
	} else {
		paddle.classList.add('defaultSkin');
	}
 
	if (savedBoardSkin) {
		board.classList.add(savedBoardSkin);
		document.getElementById('boardSkin').value = savedBoardSkin;
	} else {
		board.classList.add('defaultSkin');
	}

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
