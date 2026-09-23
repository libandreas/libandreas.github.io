document.addEventListener('DOMContentLoaded', function () {
	document.querySelectorAll('.whirlpool-contract-demo').forEach(function (demo) {
		const papers = [...demo.querySelectorAll('.whirlpool-contract-paper')];
		const matches = papers.map(paper => [...paper.querySelectorAll('.whirlpool-contract-match')]);
		const mobile = window.matchMedia('(max-width: 599px)');
		let frame = 0;

		function updateContractMatches() {
			frame = 0;
			if (!mobile.matches) return;
			papers.forEach((paper, pageIndex) => {
				const bounds = paper.getBoundingClientRect();
				const progress = (window.innerHeight * 0.85 - bounds.top) / Math.min(bounds.height, window.innerHeight * 0.7);
				matches[pageIndex].forEach((match, index) => {
					match.classList.toggle('is-visible', progress >= 0.12 + index * 0.2);
				});
			});
		}

		papers.forEach(paper => {
			const lens = paper.querySelector('.whirlpool-recognition-lens');
			paper.addEventListener('pointermove', event => {
				if (mobile.matches || event.pointerType === 'touch') return;
				const bounds = paper.getBoundingClientRect();
				lens.style.transform = `translate(${event.clientX - bounds.left}px, ${event.clientY - bounds.top}px) translate(-50%, -50%)`;
				lens.style.visibility = 'visible';
				paper.classList.add('is-scanning');
			});
			paper.addEventListener('pointerleave', () => {
				lens.style.visibility = 'hidden';
				paper.classList.remove('is-scanning');
			});
		});

		window.addEventListener('scroll', () => {
			if (mobile.matches && !frame) frame = requestAnimationFrame(updateContractMatches);
		}, { passive: true });
		window.addEventListener('resize', updateContractMatches);
		mobile.addEventListener('change', () => {
			papers.forEach((paper, index) => {
				paper.classList.remove('is-scanning');
				paper.querySelector('.whirlpool-recognition-lens').style.visibility = 'hidden';
				matches[index].forEach(match => match.classList.remove('is-visible'));
			});
			updateContractMatches();
		});
		updateContractMatches();
	});
});

document.addEventListener('DOMContentLoaded', function () {
	document.querySelectorAll('.whirlpool-explorer').forEach(explorer => {
		const rows = [...explorer.querySelectorAll('.whirlpool-explorer-row')];
		const lens = explorer.querySelector('.whirlpool-recognition-lens');
		const mobile = window.matchMedia('(max-width: 599px)');
		let frame = 0;

		function revealExplorerRows() {
			frame = 0;
			if (!mobile.matches) return;
			rows.forEach(row => {
				if (row.getBoundingClientRect().top < window.innerHeight * 0.72) {
					row.classList.add('is-discovered');
				}
			});
		}

		explorer.addEventListener('pointermove', event => {
			if (mobile.matches || event.pointerType === 'touch') return;
			const bounds = explorer.getBoundingClientRect();
			lens.style.transform = `translate(${event.clientX - bounds.left}px, ${event.clientY - bounds.top}px) translate(-50%, -50%)`;
			lens.style.visibility = 'visible';
			const row = event.target.closest('.whirlpool-explorer-row');
			if (row) row.classList.add('is-discovered');
		});
		explorer.addEventListener('pointerleave', () => {
			lens.style.visibility = 'hidden';
		});
		window.addEventListener('scroll', () => {
			lens.style.visibility = 'hidden';
			if (mobile.matches && !frame) frame = requestAnimationFrame(revealExplorerRows);
		}, { passive: true });
		window.addEventListener('resize', revealExplorerRows);
		mobile.addEventListener('change', () => {
			lens.style.visibility = 'hidden';
			rows.forEach(row => row.classList.remove('is-discovered'));
			revealExplorerRows();
		});
		revealExplorerRows();
	});
});

document.addEventListener('DOMContentLoaded', function () {
	const mainSlider = document.getElementById('ceres-browser-showcase-main');

	if (!mainSlider || typeof Splide === 'undefined') {
		return;
	}

	const pauseEmbeddedMedia = function () {
		document.querySelectorAll('.Ceres-showcase video').forEach(function (video) {
			video.pause();
			video.currentTime = 0;
		});

		document.querySelectorAll('.Ceres-showcase iframe[data-embed-src]').forEach(function (frame) {
			frame.src = frame.dataset.embedSrc;
		});
	};

	const main = new Splide(mainSlider, {
		type: 'loop',
		autoWidth: true,
		focus: 'center',
		trimSpace: false,
		pagination: false,
		arrows: true,
		speed: 560,
		gap: '1rem',
		keyboard: 'global',
		drag: true,
		mediaQuery: 'min',
		breakpoints: {
			720: {
				gap: '0.7rem',
			},
		},
	});

	main.on('move', pauseEmbeddedMedia);
	main.mount();
});
