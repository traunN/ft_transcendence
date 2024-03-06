document.addEventListener('DOMContentLoaded', function() {
	document.removeEventListener('DOMContentLoaded', initializeChat);
	document.addEventListener('DOMContentLoaded', initializeChat);
	initializeChat();
});

window.chatData = {
	socket: null,
	user: JSON.parse(sessionStorage.getItem('user')),
	jwtToken: sessionStorage.getItem('jwt')
};

function handleSubmit(event) {
	event.preventDefault();
	document.getElementById("chat-form").removeEventListener("submit", handleSubmit, false);
	var message = document.getElementById("message-input").value;
	var words = message.split(' ');
	document.getElementById("chat-form").addEventListener("submit", handleSubmit, false);
	handleCommand(words[0], words, document.getElementById("message-input"));
}

function initializeChat() {
	var chatForm = document.getElementById("chat-form");
	chatForm.removeEventListener("submit", handleSubmit, false);
	chatForm.addEventListener("submit", handleSubmit, false);
	var user = window.chatData.user;
	var jwtToken = window.chatData.jwtToken;
	if (!user) {
		console.log('Failed to get user from session storage');
		var chatContainer = document.querySelector('.chat-container');
		chatContainer.style.display = 'none';
		return;
	}
	window.chatData.socket = new WebSocket(`wss://localhost:8443/ws/rooms/${user.idName}/`);
	if (window.chatData.socket.readyState === WebSocket.OPEN) {
		window.chatData.socket.send(JSON.stringify({ type: 'join', username: user.login }));
	};

	var messageInput = document.getElementById("message-input");
	messageInput.focus();

	fetch('/get_pending_invitations/' + user.idName + '/', {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
			'X-CSRFToken': csrfToken,
			'Authorization': `Bearer ${jwtToken}`
		},
		body: JSON.stringify({
			'user_id': user.idName
		})
	}).then(function (response) {
		if (!response.ok) {
			throw new Error('Network response was not ok');
		}
		return response.json();
	}).then(function (data) {
		if (data.status === 'success') {
			var invitations = data.invitations;
			if (invitations.length > 0) {
				for (var i = 0; i < invitations.length; i++) {
					var invitationNotification = document.createElement('div');
					invitationNotification.id = 'invitation-notification';
					invitationNotification.className = 'invitation-notification';
					var closeButton = document.createElement('button');
					closeButton.className = 'close-button';
					closeButton.textContent = '×'; // Using the HTML entity for "x"
					closeButton.onclick = function () {
						this.parentElement.style.display = 'none'; // Hide the notification
					};
					invitationNotification.appendChild(closeButton);
					var invitationText = document.createElement('p');
					invitationText.id = 'invitation-text';
					if (invitations[i].isInvited) {
						invitationText.textContent = `You have a game invitation from ${invitations[i].idName}, \ntype /accept ${invitations[i].idName} to accept the invitation \nor /deny ${invitations[i].idName} to deny the invitation.`;
					}
					else {
						invitationText.textContent = `Your invitation toward ${invitations[i].idName} is still pending.`;
					}
					invitationText.innerHTML = invitationText.textContent.replace(/\n/g, '<br>');
					invitationNotification.appendChild(invitationText);
					document.body.appendChild(invitationNotification);
				}
			}

		}
	}).catch(function (error) {
		console.log('Error getting pending invitations:', error);
	});


	window.chatData.socket.onmessage = function (e) {
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
	
}
function blockUser(user_id) {
	var user = window.chatData.user;
	var jwtToken = window.chatData.jwtToken;
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
	var user = window.chatData.user;
	var jwtToken = window.chatData.jwtToken;
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
	var user = window.chatData.user;
	var jwtToken = window.chatData.jwtToken;
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
						window.chatData.socket.send(JSON.stringify(data));
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
	var user = window.chatData.user;
	var jwtToken = window.chatData.jwtToken;
	if (user_id === user.idName) {
		displayMessage('System', 'You cannot invite yourself.', 2);
		return;
	}

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
						window.chatData.socket.send(JSON.stringify({
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
	var user = window.chatData.user;
	var jwtToken = window.chatData.jwtToken;
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
						window.chatData.socket.send(JSON.stringify({
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
						var invitationNotification = document.getElementById('invitation-notification');
						invitationNotification.style.display = 'none';

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
	var user = window.chatData.user;
	var jwtToken = window.chatData.jwtToken;
	var data = {
		type: "message",
		username: user.login + "(" + user.idName + ")",
		message: message,
		idName: user.idName
	};
	window.chatData.socket.send(JSON.stringify(data));
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
			console.log('message sent');
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
			fetch('/get_user/' + args[1] + '/')
				.then(response => {
					if (!response.ok) {
						displayMessage('System', 'User not found', 2);
					}
					else
						navigateToCustompath('/profile/' + args[1]);
				});
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

function displayMessage(username, message, nb) {
	var chatMessages = document.getElementById("chat-messages");
	var messageElement = document.createElement('div');
	messageElement.style.fontFamily = "GG SANS";
	messageElement.style.lineHeight = "1.375rem";
	messageElement.style.fontWeight = "400";
	messageElement.style.wordBreak = "break-word";
	messageElement.style.whiteSpace = "break-spaces";
	messageElement.style.marginBottom = "10px";

	var usernameElement = document.createElement('span');
	usernameElement.style.color = "#caccce";
	usernameElement.style.fontSize = "18px";
	usernameElement.innerText = username + ": ";

	var messageTextElement = document.createElement('span');
	messageTextElement.style.color = "#caccce";
	messageTextElement.style.fontSize = "14px";
	messageTextElement.innerText = message;

	messageElement.appendChild(usernameElement);
	messageElement.appendChild(messageTextElement);

	if (nb === 1) {
		usernameElement.style.color = "#b18fb0";
		messageTextElement.style.color = "#b18fb0";
	} else if (nb === 2) {
		usernameElement.style.color = "orange";
		messageTextElement.style.color = "orange";
		messageTextElement.style.fontWeight = "bold";
	} else {
	}

	chatMessages.appendChild(messageElement);
	chatMessages.scrollTop = chatMessages.scrollHeight;
	document.getElementById("message-input").value = "";
}
window.addEventListener('beforeunload', customOnBeforeUnload);

function customOnBeforeUnload() {
	if (window.location.pathname !== '/chat/') {
		console.log('not on chat');
		return;
	}
	if (window.chatData.socket) {
		window.chatData.socket.close();
	}
	// remove beforeunload event
	window.removeEventListener('beforeunload', customOnBeforeUnload);
}
