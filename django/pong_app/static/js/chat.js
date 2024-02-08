document.addEventListener('DOMContentLoaded', function () {
	var user = JSON.parse(sessionStorage.getItem('user'));
	var jwtToken;
	if (!user) {
		console.log('Failed to get user from session storage');
		var chatContainer = document.querySelector('.chat-container');
		chatContainer.style.display = 'none';
		return;
	}
	jwtToken = sessionStorage.getItem('jwt');
	var socket = new WebSocket(`wss://localhost:8443/ws/rooms/${user.idName}/`);
	socket.onopen = function (e) {
		console.log('socket url:', socket.url);
		console.log('user login:', user.login);
		socket.send(JSON.stringify({ type: 'join', username: user.login }));
	};

	socket.onmessage = function (e) {
		var dataMsg = JSON.parse(e.data);
		if (dataMsg.type === 'message') {
			fetch('/check_blocked/' + dataMsg.idName + '/', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					'X-CSRFToken': csrfToken,
					'Authorization': `Bearer ${jwtToken}`
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
						if (dataMsg.is_whisper) {
							if (dataMsg.whisper_to !== user.idName) {
								return;
							}
							displayMessage(dataMsg.username, dataMsg.message, 1);
						}
						else {
							displayMessage(dataMsg.username, dataMsg.message);
						}
					}
				}
				else {
					console.log('Error checking if user is blocked:', data);
				}
			}).catch(function (error) {
				console.log('Error checking if user is blocked:', error);
			});
		}
		else if (dataMsg.type === 'game_invite') {
			if (dataMsg.to_user === user.idName) {
				roomName = dataMsg.from_user + '&' + dataMsg.to_user
				roomNameKey = dataMsg.from_user + '&' + dataMsg.to_user;
				sessionStorage.setItem('roomNameKey', roomNameKey);
				console.log('user id and idName:', user.id, user.idName);
				window.location.href = '/privateGame/' + roomName + '/';
			}
			else if (dataMsg.from_user === user.idName) {
				roomName = dataMsg.from_user + '&' + dataMsg.to_user
				roomNameKey = dataMsg.from_user + '&' + dataMsg.to_user;
				sessionStorage.setItem('roomNameKey', roomNameKey);
				console.log('user id and idName:', user.id, user.idName);
				window.location.href = '/privateGame/' + roomName + '/';
			}
		}
	};

	window.onbeforeunload = function () {
		if (socket.readyState === WebSocket.OPEN) {
			socket.close();
		}
	}

	function blockUser(user_id) {
		fetch('/block/' + user_id + '/', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				'X-CSRFToken': csrfToken,
				'Authorization': `Bearer ${jwtToken}`
			},
			body: JSON.stringify({
				'from_user': user.idName,
				'to_user': user_id,
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
	}

	function unblockUser(user_id) {
		fetch('/unblock/' + user_id + '/', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				'X-CSRFToken': csrfToken,
				'Authorization': `Bearer ${jwtToken}`
			},
			body: JSON.stringify({
				'from_user': user.idName,
				'to_user': user_id,
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
	}

	function whisperUser(user_id, message) {
		var data = {
			type: "message",
			username: user.login + "(" + user.idName + ")",
			message: message,
			idName: user.idName,
			is_whisper: true,
			whisper_to: user_id
		};
		socket.send(JSON.stringify(data));
		to_target = user_id;
		displayMessage(user_id, data.message, 1);
	}

	function inviteUser(user_id) {
		fetch('/invite/' + user_id + '/', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				'X-CSRFToken': csrfToken,
				'Authorization': `Bearer ${jwtToken}`
			},
			body: JSON.stringify({
				'from_user': user.idName,
				'to_user': user_id,
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
	}

	function acceptInvitation(user_id) {
		fetch('/accept/' + user_id + '/', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				'X-CSRFToken': csrfToken,
				'Authorization': `Bearer ${jwtToken}`
			},
			body: JSON.stringify({
				'from_user': user_id,
				'to_user': user.idName,
			})
		}).then(function (response) {
			return response.json();
		}).then(function (data) {
			if (data.status === 'success') {
				console.log('Invitation accepted');
				socket.send(JSON.stringify({
					type: 'game_invite',
					from_user: user.idName,
					to_user: user_id
				}));
			} else {
				console.log('Error accepting invitation:', data);
			}
		}).catch(function (error) {
			console.log('Error accepting invitation:', error);
		});
	}

	function sendMessage(message) {
		var data = {
			type: "message",
			username: user.login + "(" + user.idName + ")",
			message: message,
			idName: user.idName
		};
		socket.send(JSON.stringify(data));
		fetch('/send_message/', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				'X-CSRFToken': csrfToken,
				'Authorization': `Bearer ${jwtToken}`
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
	}

	function handleCommand(command, args, messageInput) {
		switch (command) {
			case '/profile':
				window.location.href = '/profile/' + args[1] + '/';
				break;
			case '/block':
				blockUser(args[1]);
				break;
			case '/unblock':
				unblockUser(args[1]);
				break;
			case '/w':
				whisperUser(args[1], args.slice(2).join(' '));
				break;
			case '/invite':
				inviteUser(args[1]);
				break;
			case '/accept':
				acceptInvitation(args[1]);
				break;
			default:
				sendMessage(messageInput.value);
				break;
		}
		messageInput.value = "";
	}

	document.getElementById("chat-form").addEventListener("submit", function (event) {
		event.preventDefault();
		var message = document.getElementById("message-input").value;

		var words = message.split(' ');
		handleCommand(words[0], words, document.getElementById("message-input"));
	}, false);

	function displayMessage(username, message, nb) {
		// if nb is 1 display in purple else display in black
		if (nb === 1) {
			var chatMessages = document.getElementById("chat-messages");
			var messageElement = document.createElement('p');
			messageElement.style.color = "purple";
			messageElement.innerText = username + ": " + message;
			chatMessages.appendChild(messageElement);
			chatMessages.scrollTop = chatMessages.scrollHeight;
			document.getElementById("message-input").value = "";
		}
		else {
			var chatMessages = document.getElementById("chat-messages");
			var messageElement = document.createElement('p');
			messageElement.innerText = username + ": " + message;
			chatMessages.appendChild(messageElement);
			chatMessages.scrollTop = chatMessages.scrollHeight;
			document.getElementById("message-input").value = "";
		}
	}
});
