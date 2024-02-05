document.addEventListener('DOMContentLoaded', function () {
	console.log('chat.js loaded');
	var user = JSON.parse(sessionStorage.getItem('user'));
	if (!user) {
		console.log('Failed to get user from session storage');
		var chatContainer = document.querySelector('.chat-container');
		chatContainer.style.display = 'none';
		return;
	}
	var socket = new WebSocket(`wss://localhost:8443/ws/rooms/${user.idName}/`);
	socket.onopen = function (e) {
		console.log('socket url:', socket.url);
		console.log('user login:', user.login);
		socket.send(JSON.stringify({ type: 'join', username: user.login }));
	};

	socket.onmessage = function (e) {
		var dataMsg = JSON.parse(e.data);
		console.log('socket message:', dataMsg);
		if (dataMsg.type === 'message') {
			fetch('/check_blocked/' + dataMsg.idName + '/', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					'X-CSRFToken': csrfToken,
				},
				body: JSON.stringify({
					'from_user': user.idName,
					'to_user': dataMsg.idName,
				})
			}).then(function (response) {
				return response.json();
			}).then(function (data) {
				if (data.status === 'success') {
					if (data.isBlocked) {
						console.log('User is blocked');
						return;
					}
					else {
						console.log('dataMsg username:', dataMsg.username);
						displayMessage(dataMsg.username, dataMsg.message);
					}
				}
				else {
					console.log('Error checking if user is blocked:', data);
				}
			}).catch(function (error) {
				console.log('Error checking if user is blocked:', error);
			});
		}
	};

	window.onbeforeunload = function () {
		if (socket.readyState === WebSocket.OPEN) {
			socket.close();
		}
	}

	document.getElementById("chat-form").addEventListener("submit", function (event) {
		event.preventDefault();
		var message = document.getElementById("message-input").value;

		// check for command /profile <user_id> and call  window.location.href = '/profile/' + words[1] + '/';
		var words = message.split(' ');
		if (words[0] === '/profile') {
			window.location.href = '/profile/' + words[1] + '/';
			return;
		}
		if (words[0] === '/block') {
			fetch('/block/' + words[1] + '/', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					'X-CSRFToken': csrfToken,
				},
				body: JSON.stringify({
					'from_user': user.idName,
					'to_user': words[1],
				})
			}).then(function (response) {
				return response.json();
			}).then(function (data) {
				if (data.status === 'success') {
					console.log('User successfully blocked');
				} else {
					console.log('Error blocking user:', data);
				}
			}).catch(function (error) {
				console.log('Error blocking user:', error);
			});
			return;
		}
		if (words[0] === '/unblock') {
			fetch('/unblock/' + words[1] + '/', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					'X-CSRFToken': csrfToken,
				},
				body: JSON.stringify({
					'from_user': user.idName,
					'to_user': words[1],
				})
			}).then(function (response) {
				return response.json();
			}).then(function (data) {
				if (data.status === 'success') {
					console.log('User successfully unblocked');
				} else {
					console.log('Error unblocking user:', data);
				}
			}).catch(function (error) {
				console.log('Error unblocking user:', error);
			});
			return;
		}
		if (words[0] === '/invite') {
			fetch('/invite/' + words[1] + '/', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					'X-CSRFToken': csrfToken,
				},
				body: JSON.stringify({
					'from_user': user.idName,
					'to_user': words[1],
				})
			}).then(function (response) {
				return response.json();
			}).then(function (data) {
				if (data.status === 'success') {
					console.log('Invitation sent');
				} else {
					console.log('Error sending invitation:', data);
				}
			}).catch(function (error) {
				console.log('Error sending invitation:', error);
			});
			return;
		}
		if (words[0] === '/accept') {
			fetch('/accept/' + words[1] + '/', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					'X-CSRFToken': csrfToken,
				},
				body: JSON.stringify({
					'from_user': user.idName,
					'to_user': words[1],
				})
			}).then(function (response) {
				return response.json();
			}).then(function (data) {
				if (data.status === 'success') {
					console.log('Invitation accepted');
				} else {
					console.log('Error accepting invitation:', data);
				}
			}).catch(function (error) {
				console.log('Error accepting invitation:', error);
			});
			return;
		}
		if (message.toString().length) {
			username = user.login + "(" + user.idName + ")";
			var data = {
				type: "message",
				username: username,
				message: message,
				idName: user.idName
			};
			socket.send(JSON.stringify(data));
			fetch('/send_message/', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					'X-CSRFToken': csrfToken,
				},
				body: JSON.stringify({
					user_id: user.idName,
					message: message
				})
			}).then(function (response) {
				return response.json();
			}).then(function (data) {
				if (data.status === 'success') {
				}
				else {
					console.log('error:', data);
				}
			}).catch(function (error) {
				console.log('error:', error);
			});
			document.getElementById("message-input").value = "";
		}
	}, false);

	function displayMessage(username, message) {
		var chatMessages = document.getElementById("chat-messages");
		var messageElement = document.createElement('p');
		messageElement.innerText = username + ": " + message;
		chatMessages.appendChild(messageElement);
		chatMessages.scrollTop = chatMessages.scrollHeight;
	}
});
