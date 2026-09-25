(() => {
	'use strict';

	const CALLBACK_PATH = '/www/openrouter-callback.html';

	if (window.top !== window || window.location.origin !== 'https://ceres-assistant.com' || window.location.pathname !== CALLBACK_PATH) {
		return;
	}

	// Keep callback parameters visible in the URL for troubleshooting, as in the localhost flow.
	// Keep callback parameters visible in the URL for troubleshooting, as in the localhost flow.
	const callbackUrl = new URL(window.location.href);
	const code = String(callbackUrl.searchParams.get('code') || '').trim();
	const oauthError = String(callbackUrl.searchParams.get('error') || '').trim();
	console.log(`[OpenRouter OAuth callback] Page loaded. origin=${window.location.origin} path=${window.location.pathname} hasCode=${code.length > 0} codeLength=${code.length} hasError=${oauthError.length > 0}`);

	function updatePage(title, message) {
		const applyUpdate = () => {
			const titleElement = document.querySelector('h1');
			const messageElement = document.querySelector('p');
			if (titleElement) {
				titleElement.textContent = title;
			}
			if (messageElement) {
				messageElement.textContent = message;
			}
		};

		if (document.readyState === 'loading') {
			document.addEventListener('DOMContentLoaded', applyUpdate, { once: true });
		} else {
			applyUpdate();
		}
	}

	const hasValidCode = code.length > 0 && code.length <= 2048;

	if (oauthError) {
		console.log(`[OpenRouter OAuth callback] OpenRouter returned an OAuth error. error=${oauthError}`);
		updatePage('Account connection failed', 'Return to Browser and try again.');
	} else if (!hasValidCode) {
		console.log(`[OpenRouter OAuth callback] Authorization code is missing or invalid. codeLength=${code.length}`);
		updatePage('Account connection failed', 'Return to Browser and try again.');
	} else {
		console.log(`[OpenRouter OAuth callback] Authorization code received. codeLength=${code.length}`);
		updatePage('Account connected', 'Return to Browser.');
	}

	chrome.runtime.sendMessage({
		type: 'OPENROUTER_OAUTH_CALLBACK',
		code,
		error: oauthError
	}, (response) => {
		const runtimeError = chrome.runtime.lastError;
		if (runtimeError) {
			console.log(`[OpenRouter OAuth callback] Could not contact the service worker. error=${runtimeError.message}`);
			updatePage('Account connection failed', 'Return to Browser and try again.');
			return;
		}
		if (response && response.success === false) {
			console.log(`[OpenRouter OAuth callback] Service worker rejected the callback. error=${response.error || 'Unknown error'}`);
			updatePage('Account connection failed', 'Return to Browser and try again.');
			return;
		}
		console.log(`[OpenRouter OAuth callback] Service worker completed the callback successfully.`);
	});
})();
