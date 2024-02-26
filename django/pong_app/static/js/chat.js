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
						else if (dataMsg.is_invite) {
							if (dataMsg.whisper_to !== user.idName) {
								return;
							}
							displayMessage(dataMsg.username, dataMsg.message, 2);
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
		fetch('/check_blocked/' + user.idName + '/', {
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
				if (data.isBlocked) {
					console.log('User is already blocked');
				}
				else {
					fetch('/block/' + user.idName + '/', {
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
			}
			else {
				console.log('Error checking if user is blocked:', data);
			}
		}).catch(function (error) {
			console.log('Error checking if user is blocked:', error);
		});
	}

	function unblockUser(user_id) {
		fetch('/check_blocked/' + user.idName + '/', {
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
				if (data.isBlocked) {
					fetch('/unblock/' + user.idName + '/', {
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
					return;
				}
				else {
					console.log('User is not blocked');
				}
			}
			else {
				console.log('Error checking if user is blocked:', data);
			}
		}).catch(function (error) {
			console.log('Error checking if user is blocked:', error);
		});
	}

	function whisperUser(user_id, message) {
		fetch('/check_blocked/' + user.idName + '/', {
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
				if (data.isBlocked) {
					console.log('User is blocked');
				}
				else {
					fetch('/whisper/' + user.idName + '/', {
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
							from_target = "From > " + user.login + "(" + user.idName + ")";
							var data = {
								type: "message",
								username: from_target,
								message: message,
								idName: user.idName,
								is_whisper: true,
								whisper_to: user_id
							};
							socket.send(JSON.stringify(data));
							to_target = user_id;
							to_target = "To > " + to_target;
							displayMessage(to_target, data.message, 1);
						} else {
							displayMessage("[System] ", "Cannot whisper to this user.", 2);
						}
					}).catch(function (error) {
						console.log('Error sending whisper:', error);
					});
				}
			}
			else {
				displayMessage("[System] ", "Cannot whisper to this user.", 2);
			}
		}).catch(function (error) {
			console.log('Error checking if user is blocked:', error);
		});
	}

	function inviteUser(user_id) {
		fetch('/check_blocked/' + user.idName + '/', {
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
				if (data.isBlocked) {
					console.log('User is blocked');
				}
				else {
					fetch('/invite/' + user.idName + '/', {
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
							socket.send(JSON.stringify({
								type: 'message',
								username: "System",
								message: user.idName + " invited you to play a game. type /accept " + user.idName + " to accept the invitation or /deny " + user.idName + " to deny the invitation.",
								idName: user.idName,
								is_invite: true,
								whisper_to: user_id,
							}));
							displayMessage('System', 'Invitation sent.', 2);
						} else {
							console.log('Error sending invitation:', data);
						}
					}).catch(function (error) {
						console.log('Error sending invitation:', error);
					});
				}
			}
			else {
				displayMessage('System', 'Cannot send invite to this user.', 2);
			}
		}).catch(function (error) {
			console.log('Error checking if user is blocked:', error);
		});
		
	}

	function acceptInvitation(user_id) {
		fetch('/check_blocked/' + user.idName + '/', {
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
				if (data.isBlocked) {
					console.log('User is blocked');
				}
				else {
					fetch('/accept/' + user.idName + '/', {
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
			}
			else {
				console.log('Error checking if user is blocked:', data);
			}
		}).catch(function (error) {
			console.log('Error checking if user is blocked:', error);
		});
	}

	function denyInvitation(user_id) {
		fetch('/check_blocked/' + user.idName + '/', {
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
				if (data.isBlocked) {
					console.log('User is blocked');
				}
				else {
					fetch('/deny/' + user.idName + '/', {
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
							console.log('Invitation denied');
							displayMessage('System', 'Invitation denied', 2);
						} else {
							console.log('Error denying invitation:', data);
						}
					}).catch(function (error) {
						console.log('Error denying invitation:', error);
					});
				}
			}
			else {
				displayMessage('System', 'No invitation from this user.', 2);
			}
		}).catch(function (error) {
			console.log('Error checking if user is blocked:', error);
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
		console.log('args:', args);
		switch (command) {
			case '/profile':
				if (args.length > 2) {
					displayMessage('System', 'Usage: /profile [user_id]', 2);
					return;
				}
				
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
			case '/deny':
				denyInvitation(args[1]);
				break;
			case '/help':
				displayMessage('System', '/profile [user_id] - view user profile', 2);
				displayMessage('System', '/block [user_id] - block user', 2);
				displayMessage('System', '/unblock [user_id] - unblock user', 2);
				displayMessage('System', '/w [user_id] [message] - whisper to user', 2);
				displayMessage('System', '/invite [user_id] - invite user to play a game', 2);
				displayMessage('System', '/accept [user_id] - accept game invitation', 2);
				displayMessage('System', '/deny [user_id] - deny game invitation', 2);
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
		else if (nb === 2) {
			var chatMessages = document.getElementById("chat-messages");
			var messageElement = document.createElement('p');
			messageElement.style.color = "orange";
			messageElement.style.fontWeight = "bold";
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
