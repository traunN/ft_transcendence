document.addEventListener('DOMContentLoaded', function () {
	let loadedScripts = new Set();

	function navigateToPath(path) {
		fetch(path)
			.then(response => response.text())
			.then(data => {
				const parser = new DOMParser();
				const doc = parser.parseFromString(data, 'text/html');
				document.body.innerHTML = doc.body.innerHTML;
				document.head.innerHTML = doc.head.innerHTML;
				
				initializeLogin();
				const scripts = doc.head.querySelectorAll('script');
				scripts.forEach(script => {
					if (loadedScripts.has(script.src)) {
						return;
					}
					const newScript = document.createElement('script');
					newScript.src = script.src;
					newScript.textContent = script.textContent;
					document.head.appendChild(newScript);
					loadedScripts.add(script.src);
				});
				
				window.history.pushState({}, '', path);
				if (path.includes('profile')) {
					initializeProfile();
				}
			})
			.catch(error => console.error('Error:', error));
	}


	// Event delegation for handling clicks on .nav-link elements
	document.body.addEventListener('click', function (e) {
		const target = e.target;
		if (target.matches('.nav-link')) {
			e.preventDefault();
			navigateToPath(target.href);
		}
	});
});
