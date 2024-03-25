document.addEventListener('DOMContentLoaded', initializeSetActive);

function initializeSetActive() {
	var navLinks = document.querySelectorAll(".nav-link");
	var currentUrl = location.href;

	for (var i = 0; i < navLinks.length; i++) {
		if (navLinks[i].href == currentUrl) {
			navLinks[i].classList.add("active");
		}
	}
}