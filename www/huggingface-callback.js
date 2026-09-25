(async () => {
	if (window !== window.top || location.origin !== 'https://ceres-assistant.com' ||
		location.pathname !== '/www/huggingface-callback.html') return;
	// Keep callback parameters visible in the URL for troubleshooting, as in the localhost flow.
	// Keep callback parameters visible in the URL for troubleshooting, as in the localhost flow.
	const parameters = new URLSearchParams(location.search);
	const loaded = document.readyState === 'loading'
		? new Promise(resolve => document.addEventListener('DOMContentLoaded', resolve, { once: true }))
		: Promise.resolve();
	try {
		const response = await chrome.runtime.sendMessage({
			type: 'HUGGINGFACE_OAUTH_CALLBACK', code: parameters.get('code'),
			state: parameters.get('state'), error: parameters.get('error')
		});
		if (!response?.success) throw new Error(response?.error || 'Could not connect Hugging Face.');
		await loaded;
		document.querySelector('h1').textContent = 'Hugging Face connected';
		document.querySelector('p').textContent = 'You can close this tab and return to Ceres.';
	} catch (error) {
		await loaded;
		document.querySelector('h1').textContent = 'Connection failed';
		document.querySelector('p').textContent = error.message;
	}
})();
