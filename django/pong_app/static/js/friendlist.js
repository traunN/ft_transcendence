document.addEventListener('DOMContentLoaded', function () {
	console.log('friendlist.js loaded');

	var user = sessionStorage.getItem('user');
	var friendList = document.getElementById('friendList');
	var toggleButton = document.getElementById('toggleButton');
	var friendListContent = document.getElementById('friendListContent');
	var addFriendInput = document.getElementById('addFriendInput');
	var addFriendButton = document.getElementById('addFriendButton');

    if (!user) {
		if (addFriendButton) {
			addFriendButton.style.display = 'none';
		}
		if (friendListContent) {
			friendListContent.style.display = 'none';
		}
		return;
    }


	// Explicitly set the display property to 'none'
	friendListContent.style.display = 'none';
	var isHidden = true;

	toggleButton.addEventListener('click', function () {
		isHidden = !isHidden;
		friendListContent.style.display = isHidden ? 'none' : 'block';
	});

	addFriendButton.addEventListener('click', function () {
		var friendName = addFriendInput.value;
		if (friendName) {
			var friendListItem = document.createElement('div');
			friendListItem.textContent = friendName;
			friendListItem.className = 'friend-list-item';
			friendListContent.appendChild(friendListItem);
			addFriendInput.value = '';
		}
	});
});