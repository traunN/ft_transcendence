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
		ball.className = 'ball ' + ballSkin;
	});
	

	document.getElementById('paddleSkin').addEventListener('change', function () {
		var paddleSkin = this.value;
		sessionStorage.setItem('paddleSkin', paddleSkin);
		paddle.className = 'paddle ' + paddleSkin;
	});

	document.getElementById('boardSkin').addEventListener('change', function () {
		var boardSkin = this.value;
		sessionStorage.setItem('boardSkin', boardSkin);
		board.className = 'board ' + boardSkin;
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
});
