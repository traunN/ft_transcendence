document.addEventListener('DOMContentLoaded', initializeSettings);

function initializeSettings() {
	var ballSkin = sessionStorage.getItem('ballSkin') || 'skin1';
	var paddleSkin = sessionStorage.getItem('paddleSkin') || 'skin1';
	var boardSkin = sessionStorage.getItem('boardSkin') || 'skin1';
	var skinSettingsForm = document.getElementById('skinSettingsForm');
	var user = JSON.parse(sessionStorage.getItem('user'));
	var pleaseLoginCard = document.getElementById('pleaseLoginCard');
	var textSizeSelect = document.getElementById('textSizeSelect');
	if (!user)
	{
		deleteAccountButton.style.display = 'none';
		skinSettingsForm.style.display = 'none';
		pleaseLoginCard.style.display = 'block';
		return;
	}
	const elements = {
		ball: document.querySelector('.ball'),
		paddle: document.querySelector('.paddle'),
		board: document.querySelector('.board')
	};

	var textSizePreference = sessionStorage.getItem('textSizePreference');
	if (textSizePreference) {
		document.body.classList.add(textSizePreference + '-text');
		document.getElementById('textSizeSelect').value = textSizePreference;
	}
	textSizeSelect.addEventListener('change', function() {
		document.body.classList.remove('small-text', 'medium-text', 'large-text');
		document.body.classList.add(this.value + '-text');
		sessionStorage.setItem('textSizePreference', this.value);
	});

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