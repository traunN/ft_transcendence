document.addEventListener('DOMContentLoaded', function () {
	console.log('friendlist.js loaded');
	// re_path(r'ws/friendList/$', consumers.FriendListConsumer.as_asgi()),
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

	socket = new WebSocket('wss://localhost:8443/ws/friendList/');
	if (!socket) {
		console.log('Failed to create socket');
		return;
	}

	socket.onopen = function (e) {
		console.log('Successfully connected to the websocket');
	}

	socket.onmessage = function(event) {
		var data = JSON.parse(event.data);
		console.log(data);
		if (data.type === 'add_friend') {
			// Show a notification to the user
			alert(`You have received a friend request from ${data.from_user}`);
		}
	};
	// Explicitly set the display property to 'none'
	friendListContent.style.display = 'none';
	var isHidden = true;

	toggleButton.addEventListener('click', function () {
		isHidden = !isHidden;
		friendListContent.style.display = isHidden ? 'none' : 'block';
	});

	addFriendButton.addEventListener('click', function () {
		var friendName = addFriendInput.value;
		console.log ('friendName:', friendName);
		console.log ('user:', user.idName);
		if (friendName) {
			// Send a message to the server
			socket.send(JSON.stringify({
				'type': 'add_friend',
				'from_user': user.id, // Assuming 'user' contains the ID of the current user
				'to_user': friendName // Assuming 'friendName' contains the username of the user being requested
			}));
	
			var friendListItem = document.createElement('div');
			friendListItem.textContent = friendName;
			friendListItem.className = 'friend-list-item';
			friendListContent.appendChild(friendListItem);
			addFriendInput.value = '';
		}
	});
	
});