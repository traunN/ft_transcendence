document.addEventListener('DOMContentLoaded', initializeFriends, true);

window.friendData = {
	socket: null,
	user: JSON.parse(sessionStorage.getItem('user')),
	friends: []
};

function CheckIfUser(){
	if (sessionStorage.getItem('user'))
	{
		if (JSON.parse(sessionStorage.getItem('user'))){
			initializeFriends(false);
			friendListContent.style.display = 'block';
			addFriendButton.style.display = 'block';
		}
	}
}

function initializeFriends(isHidden) {
	var user = JSON.parse(sessionStorage.getItem('user'));
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
		toggleButton.addEventListener('click', CheckIfUser);
		return;
	}
	toggleButton.removeEventListener('click', CheckIfUser);
	updateFriendList();

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
		document.getElementById('friendListNames').innerHTML = '';
		fetch('/get_friends/' + user.idName + '/')
			.then(response => response.json())
			.then(data => {
				window.friendData.friends = data.friends;
				if (window.friendData.friends.length === 0) {
					return;
				}

				let table = document.getElementById('friendListNames');
				table.innerHTML = '';

				for (let i = 0; i < window.friendData.friends.length; i++) {
					(function(index) {
						let friend_login = window.friendData.friends[index].login;

						fetch('/is_user_online/' + window.friendData.friends[index].idName + '/')
							.then(response => response.json())
							.then(data => {

								let test = Array.from(table.rows).find(row => row.cells[0].textContent === friend_login);
								if (test)
									return;

								let row = table.insertRow(-1);
								let friend = row.insertCell(0);
								friend.innerHTML = friend_login;
								if (data.isOnline) {
									friend.style.color = 'green';
								} else {
									friend.style.color = 'red';
								}
								var deleteButton = document.createElement('button');
								deleteButton.innerHTML = 'x';
								deleteButton.className = 'delete-friend-btn';
								var cell = row.insertCell(1);
								cell.appendChild(deleteButton);
								deleteButton.addEventListener('click', function () {
									getJwtFromCookie().then(jwtToken => {
										fetch('/delete_friend/', {
											method: 'POST',
											headers: {
												'Content-Type': 'application/json',
												'X-CSRFToken': csrfToken,
												'Authorization': `Bearer ${jwtToken}`
											},
											body: JSON.stringify({
												'from_user': user.idName,
												'to_user': window.friendData.friends[index].idName
											}),
										})
											.then(response => response.json())
											.then(data => {
												if (data.status === 'success') {
													window.friendData.socket.send(JSON.stringify({
														'type': 'friend_request_accepted',
														'from_user': user.idName,
														'to_user': window.friendData.friends[index].idName
													}));
													updateFriendList();
												}
											});
									}
									).catch(error => {
									});
								});
							});
					})(i);
				}

			});
	}
	updateFriendList();

	window.friendData.socket.onmessage = function (event) {
		var data = JSON.parse(event.data);
		updateFriendList();
		if (data.type === 'friend_request') {
			var from_user = data.from_user;
			document.getElementById('notificationMessage').innerText = `You have received a friend request from ${data.from_user}`;
			document.getElementById('notificationContainer').style.display = 'flex';
			document.getElementById('acceptRequest').addEventListener('click', function () {
				getJwtFromCookie().then(jwtToken => {
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
									'to_user': from_user
								}));
							}
						});
					document.getElementById('notificationContainer').style.display = 'none';
				}
				).catch(error => {
				});
			});
			document.getElementById('denyRequest').addEventListener('click', function () {
				document.getElementById('notificationContainer').style.display = 'none';
			});
		}
	};
	friendListContent.style.display = 'none';

	toggleButton.addEventListener('click', function () {
		isHidden = !isHidden;
		friendListContent.style.display = isHidden ? 'none' : 'block';
		updateFriendList();
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
		if (window.friendData.socket.readyState === 1) {
			window.friendData.socket.close();
		}
	}
}
