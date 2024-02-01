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
	user = JSON.parse(sessionStorage.getItem('user'));
	console.log('User infos: ' + JSON.stringify(user));
	socket = new WebSocket('wss://localhost:8443/ws/friendList/' + user.idName + '/');
	if (!socket) {
		console.log('Failed to create socket');
		return;
	}

	socket.onopen = function (e) {
		console.log('Successfully connected to the websocket');
	}

	function updateFriendList() {
		fetch('/get_friends/' + user.idName + '/')
			.then(response => response.json())
			.then(data => {
				if (data) {
					console.log(data);
				}
				var friends = data.friends;
				if (data.friends.length === 0) {
					return;
				}
				var table = document.getElementById('friendListNames');
				for (var i = 0; i < friends.length; i++) {
					friend_login = friends[i].login;
					fetch('/is_user_online/' + friends[i].idName + '/')
						.then(response => response.json())
						.then(data => {
							var row = table.insertRow(-1);
							var friend = row.insertCell(0);
							friend.innerHTML = friend_login;
							if (data.isOnline) {
								friend.style.color = 'green';
							} else {
								friend.style.color = 'red';
							}
						});
				}
			});
	}

	// Call the function when the page loads
	updateFriendList();

	socket.onmessage = function (event) {
		console.log('lol');
		var data = JSON.parse(event.data);
		console.log(data);
		if (data.type === 'friend_request') {
			if (data.type === 'friend_request') {
				document.getElementById('notificationMessage').innerText = `You have received a friend request from ${data.from_user}`;
				document.getElementById('notificationContainer').style.display = 'flex';
			}

			document.getElementById('acceptRequest').addEventListener('click', function () {
				fetch('/accept_friend_request/', {
					method: 'POST',
					headers: {
						'Content-Type': 'application/json',
						'X-CSRFToken': csrfToken,
					},
					body: JSON.stringify({
						'from_user': data.from_user,
						'to_user': user.idName,
					}),
				})
					.then(response => response.json())
					.then(data => {
						if (data.status === 'success') {
							// Handle success
						} else {
							// Handle failure
						}
					});
				document.getElementById('notificationContainer').style.display = 'none';
			});

			document.getElementById('denyRequest').addEventListener('click', function () {
				document.getElementById('notificationContainer').style.display = 'none';
			});
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
		if (friendName) {
			// Send a message to the server
			console.log('Sending friend request')
			socket.send(JSON.stringify({
				'type': 'friend_request',
				'from_user': user.idName, // Assuming 'user' contains the ID of the current user
				'to_user': friendName // Assuming 'friendName' contains the username of the user being requested
			}));

			addFriendInput.value = '';
		}
	});

});