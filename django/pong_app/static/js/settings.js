document.addEventListener('DOMContentLoaded', initializeSettings);

function initializeSettings() {
	var ballSkin = sessionStorage.getItem('ballSkin') || 'skin1';
	var paddleSkin = sessionStorage.getItem('paddleSkin') || 'skin1';
	var boardSkin = sessionStorage.getItem('boardSkin') || 'skin1';

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
		var selectElement = document.getElementById(storageKey);
		selectElement.value = skin;
		selectElement.addEventListener('change', function () {
			var newSkin = this.value;
			sessionStorage.setItem(storageKey, newSkin);
			element.className = `${element.className.split(' ')[0]} ${newSkin}`;
		});
		if (storageKey === 'boardSkin' && skin === 'skin1') {
			element.style.backgroundColor = 'black';
		}
	}
}