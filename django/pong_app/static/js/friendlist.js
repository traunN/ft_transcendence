document.addEventListener('DOMContentLoaded', function () {
	document.removeEventListener('DOMContentLoaded', initializeFriends);
	document.addEventListener('DOMContentLoaded', initializeFriends);
	initializeFriends();
});

window.friendData = {
	socket: null,
	user: JSON.parse(sessionStorage.getItem('user')),
	jwtToken: sessionStorage.getItem('jwt')
};

function initializeFriends() {
	var user = window.friendData.user;
	var friendList = document.getElementById('friendList');
	var toggleButton = document.getElementById('toggleButton');
	var friendListContent = document.getElementById('friendListContent');
	var addFriendInput = document.getElementById('addFriendInput');
	var addFriendButton = document.getElementById('addFriendButton');
	var jwtToken = window.friendData.jwtToken;
	if (!user) {
		if (addFriendButton) {
			addFriendButton.style.display = 'none';
		}
		if (friendListContent) {
			friendListContent.style.display = 'none';
		}
		return;
	}
	if (!user) {
		console.log('Failed to get user from session storage');
		return;
	}
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
	window.friendData.socket = new WebSocket('wss://localhost:8443/ws/friendList/' + user.idName + '/');
	if (!window.friendData.socket) {
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
					var deleteButton = document.createElement('button');
					deleteButton.innerHTML = 'Delete';
					deleteButton.addEventListener('click', function () {
						fetch('/delete_friend/', {
							method: 'POST',
							headers: {
								'Content-Type': 'application/json',
								'X-CSRFToken': csrfToken,
								'Authorization': `Bearer ${jwtToken}`
							},
							body: JSON.stringify({
								'from_user': user.idName,
								'to_user': friends[i].idName
							}),
						})
							.then(response => response.json())
							.then(data => {
								if (data.status === 'success') {
									updateFriendList();
								}
							});
					});
				}
			});
	}
	updateFriendList();

	window.friendData.socket.onmessage = function (event) {
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
							window.friendData.socket.send(JSON.stringify({
								'type': 'friend_request_accepted',
								'from_user': user.idName,
								'to_user': data.from_user
							}));
						}
					});
				document.getElementById('notificationContainer').style.display = 'none';
			});
			document.getElementById('denyRequest').addEventListener('click', function () {
				document.getElementById('notificationContainer').style.display = 'none';
			});
		}
		if (data.type === 'friend_request_accepted') {
			updateFriendList();
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
			window.friendData.socket.send(JSON.stringify({
				'type': 'friend_request',
				'from_user': user.idName,
				'to_user': friendName
			}));
			addFriendInput.value = '';
		}
	});

}

window.addEventListener('beforeunload', friendOnBeforeUnload);

function friendOnBeforeUnload() {
	window.removeEventListener('beforeunload', friendOnBeforeUnload);
	if (window.friendData.socket) {
		window.friendData.socket.close();
	}
}