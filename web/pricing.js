document.addEventListener('DOMContentLoaded', () => {
	const dropdownTrigger = document.querySelector('.dropdown-trigger');
	const dropdownMenu = document.querySelector('.dropdown-menu');

	if (dropdownTrigger && dropdownMenu) {
		dropdownTrigger.addEventListener('click', (e) => {
			e.preventDefault();
			e.stopPropagation();
			dropdownTrigger.classList.toggle('active');
		});

		// Close dropdown when clicking outside
		document.addEventListener('click', (e) => {
			if (!dropdownTrigger.contains(e.target) && !dropdownMenu.contains(e.target)) {
				dropdownTrigger.classList.remove('active');
			}
		});

		// Close dropdown when a link inside the menu is clicked
		dropdownMenu.querySelectorAll('a').forEach(link => {
			link.addEventListener('click', () => {
				dropdownTrigger.classList.remove('active');
			});
		});
	}
});
