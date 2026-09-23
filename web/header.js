(function () {
	var trigger = document.querySelector('.dropdown-trigger');
	var menu = document.querySelector('.dropdown-menu');

	if (!trigger || !menu) {
		return;
	}

	trigger.addEventListener('click', function (event) {
		event.preventDefault();
		var isOpen = trigger.classList.toggle('active');
		trigger.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
	});

	document.addEventListener('click', function (event) {
		if (trigger.contains(event.target) || menu.contains(event.target)) {
			return;
		}

		trigger.classList.remove('active');
		trigger.setAttribute('aria-expanded', 'false');
	});
})();
