document.addEventListener('DOMContentLoaded', function () {
	var user = JSON.parse(sessionStorage.getItem('user'));

	var ballSkin = sessionStorage.getItem('ballSkin') || 'defaultSkin';
	var paddleSkin = sessionStorage.getItem('paddleSkin') || 'defaultSkin';
	var boardSkin = sessionStorage.getItem('boardSkin') || 'defaultSkin';

	const elements = {
		ball: document.querySelector('.ball'),
		paddle: document.querySelector('.paddle'),
		board: document.querySelector('.board')
	};

	applySkin(elements.board, boardSkin, 'boardSkin');
	applySkin(elements.ball, ballSkin, 'ballSkin');
	applySkin(elements.paddle, paddleSkin, 'paddleSkin');

	function applySkin(element, skin, storageKey) {
		element.classList.add(skin);
		document.getElementById(storageKey).addEventListener('change', function () {
			var newSkin = this.value;
			sessionStorage.setItem(storageKey, newSkin);
			element.className = `${element.className.split(' ')[0]} ${newSkin}`;
		});
	}
});
