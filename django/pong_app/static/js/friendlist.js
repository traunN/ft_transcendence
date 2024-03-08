function initializeFriends() {
	var user = sessionStorage.getItem('user');
	var friendList = document.getElementById('friendList');
	var toggleButton = document.getElementById('toggleButton');
	var friendListContent = document.getElementById('friendListContent');
	var addFriendInput = document.getElementById('addFriendInput');
	var addFriendButton = document.getElementById('addFriendButton');
	var jwtToken;
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
	if (!user) {
		console.log('Failed to get user from session storage');
		return;
	}
	jwtToken = sessionStorage.getItem('jwt');

	fetch('/get_user/' + user.idName + '/')
		.then(response => {
			if (!response.ok) {
				sessionStorage.removeItem('user');
				return response.text().then(text => {
					throw new Error('Server error: ' + text);
				});
			}
			return response.json();
		})
		.then(data => {
			if (!data.user) {
				sessionStorage.removeItem('user');
				return;
			}
		});
	socket = new WebSocket('wss://localhost:8443/ws/friendList/' + user.idName + '/');
	if (!socket) {
		console.log('Failed to create socket');
		return;
	}

	function updateFriendList() {
		fetch('/get_friends/' + user.idName + '/')
			.then(response => response.json())
			.then(data => {
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
	updateFriendList();

	socket.onmessage = function (event) {
		var data = JSON.parse(event.data);
		updateFriendList();
		if (data.type === 'friend_request') {
			document.getElementById('notificationMessage').innerText = `You have received a friend request from ${data.from_user}`;
			document.getElementById('notificationContainer').style.display = 'flex';
			document.getElementById('acceptRequest').addEventListener('click', function () {
				fetch('/accept_friend_request/', {
					method: 'POST',
					headers: {
						'Content-Type': 'application/json',
						'X-CSRFToken': csrfToken,
						'Authorization': `Bearer ${jwtToken}`
					},
					body: JSON.stringify({
						'from_user': data.from_user,
						'to_user': user.idName,
					}),
				})
					.then(response => response.json())
					.then(data => {
						if (data.status === 'success') {
							updateFriendList();
						}
					});
				document.getElementById('notificationContainer').style.display = 'none';
			});
			document.getElementById('denyRequest').addEventListener('click', function () {
				document.getElementById('notificationContainer').style.display = 'none';
			});
		}
	};
	friendListContent.style.display = 'none';
	var isHidden = true;

	toggleButton.addEventListener('click', function () {
		isHidden = !isHidden;
		friendListContent.style.display = isHidden ? 'none' : 'block';
	});

	addFriendButton.addEventListener('click', function () {
		var friendName = addFriendInput.value;
		if (friendName) {
			socket.send(JSON.stringify({
				'type': 'friend_request',
				'from_user': user.idName,
				'to_user': friendName
			}));
			addFriendInput.value = '';
		}
	});

}

document.addEventListener('DOMContentLoaded', initializeFriends);