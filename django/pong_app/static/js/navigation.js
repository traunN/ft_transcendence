function navigateToCustompath(path) {
	const event = new CustomEvent('navigateToPath', { detail: { path: path } });
	document.dispatchEvent(event);
}

document.addEventListener('DOMContentLoaded', function () {
	let loadedScripts = new Set();

	document.addEventListener('navigateToPath', function (e) {
		const path = e.detail.path;
		const currentPath = window.location.pathname;
		navigateToPath(path, currentPath);
	});

	function loadScript(src) {
		return new Promise((resolve, reject) => {
			const script = document.createElement('script');
			script.src = src;
			script.onload = () => resolve();
			script.onerror = () => reject(new Error(`Script load error for ${src}`));
			// Check if the script is already in the document
			if (!document.querySelector(`script[src="${src}"]`)) {
				document.head.appendChild(script);
			} else {
				resolve(); // If the script is already loaded, resolve the promise
			}
		});
	}

	function navigateToPath(path, currentPath) {
		fetch(path)
			.then(response => response.text())
			.then(data => {
				if (currentPath.includes('chat')) {
					customOnBeforeUnload();
				}
				const parser = new DOMParser();
				const doc = parser.parseFromString(data, 'text/html');
				document.body.innerHTML = doc.body.innerHTML;
				document.head.innerHTML = doc.head.innerHTML;

				const scripts = doc.head.querySelectorAll('script');
				const loadPromises = [];

				scripts.forEach(script => {
					if (loadedScripts.has(script.src)) {
						return;
					}
					if (script.src.includes('profile.js')) {
						loadPromises.push(loadScript(script.src));
					} else if (script.src.includes('main.js')) {
						loadPromises.push(loadScript(script.src));
					} else if (script.src.includes('chat.js')) {
						loadPromises.push(loadScript(script.src));
					} else if (script.src.includes('leaderboard.js')) {
						loadPromises.push(loadScript(script.src));
					} else if (script.src.includes('createAccount.js')) {
						loadPromises.push(loadScript(script.src));
					} else if (script.src.includes('privateGame.js')) {
						loadPromises.push(loadScript(script.src));
					} else if (script.src.includes('settings.js')) {
						loadPromises.push(loadScript(script.src));
					} else if (script.src.includes('setup2FA.js')) {
						loadPromises.push(loadScript(script.src));
					} else if (script.src.includes('tournament.js')) {
						loadPromises.push(loadScript(script.src));
					} else if (path.includes('tournament_lobby')) {
						loadPromises.push(loadScript(script.src));
					} else if (path.includes('tournament_game')) {
						loadPromises.push(loadScript(script.src));
					} else {
						const newScript = document.createElement('script');
						newScript.src = script.src;
						newScript.textContent = script.textContent;
						document.head.appendChild(newScript);
						loadedScripts.add(script.src);
					}
					
				});

				Promise.all(loadPromises)
					.then(() => {
						if (currentPath.includes('pongGame')) {
							customOnBeforeUnload();
						}
						
						if (currentPath.includes('privateGame')) {
							customOnBeforeUnload();
						}
						window.history.pushState({}, '', path);
						initializeLogin();
						initializeSetActive();
						initializeFriends();
						if (path.includes('profile')) {
							initializeProfile();
						} else if (path.includes('pongGame')) {
							initializePongGame();
						} else if (path.includes('chat')) {
							initializeChat();
						} else if (path.includes('leaderboard')) {
							initializeLeaderboard();
						} else if (path.includes('createAccount')) {
							initializeCreateAccount();
						} else if (path.includes('privateGame')) {
							initializePrivateGame();
						} else if (path.includes('settings')) {
							initializeSettings();
						} else if (path.includes('setup_2fa')) {
							initializeSetup2FA();
						} else if (path.includes('tournament_lobby')) {
							console.log('initializeTournamentLobby');
							initializeTournamentLobby();
						} else if (path.includes('tournament_game')) {
							initializeTournamentGame();
						} else if (path.includes('tournament')) {
							console.log('initializeTournament');
							initializeTournament();
						}
					})
					.catch(error => console.error('Error:', error));
			})
			.catch(error => console.error('Error:', error));
	}

	document.body.addEventListener('click', function (e) {
		const target = e.target;
		if (target.matches('.nav-link')) {
			e.preventDefault();
			const targetPath = target.href;
			const currentPath = window.location.pathname;
			navigateToPath(targetPath, currentPath);
		}
	});
});
