const scopePath = new URL(self.registration.scope).pathname;
const scopeName = scopePath.replace(/^\/+|\/+$/g, '').replace(/[^a-z0-9]+/gi, '-') || 'root';
const CACHE_NAME = `pwa-${scopeName}`;
let requestSession;

async function isPwaClient(clientId) {
	if (!clientId) return false;
	const client = await self.clients.get(clientId);
	if (!client || client.type !== 'window') return false;
	return new URL(client.url).searchParams.get('mode') === 'pwa';
}

function startRequestSession() {
	const session = {
		downloads: new Map()
	};
	requestSession = session;
	return session;
}

const manifestSuffix = /\/index(-\d+)?\.html$/i.exec(scopePath)?.[1] || '';
const pwaManifestUrl = new URL(`/manifest${manifestSuffix}.webmanifest`, self.location.origin).href;
const versionManifestUrl = new URL('/manifest.json', self.location.origin).href;
let updateNotification = null;

async function notifyPwaUpdate(session) {
	if (!updateNotification) {
		updateNotification = (async () => {
			const [pwaResponse, versionResponse] = await Promise.all([
				loadRequest(new Request(pwaManifestUrl), session),
				loadRequest(new Request(versionManifestUrl), session)
			]);
			if (!pwaResponse.ok || !versionResponse.ok) {
				throw new Error(`Manifest unavailable: PWA HTTP ${pwaResponse.status}, version HTTP ${versionResponse.status}`);
			}
			const [pwaManifest, versionManifest] = await Promise.all([pwaResponse.json(), versionResponse.json()]);
			const name = String(pwaManifest.name || pwaManifest.short_name || '').trim();
			const version = String(versionManifest.version || '').trim();
			if (!version) return;
			const clients = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
			for (const client of clients) {
				if (new URL(client.url).pathname === scopePath && await isPwaClient(client.id)) {
					client.postMessage({ type: 'PWA_CACHE_UPDATED', name, version });
				}
			}
		})().finally(() => { updateNotification = null; });
	}
	return updateNotification;
}

// Revalidate in the background, or download a file missing from Cache Storage.
function loadRequest(request, session) {
	const url = new URL(request.url);
	const cacheKey = url.href;
	if (!session.downloads.has(cacheKey)) {
		const download = (async () => {
			const cache = await caches.open(CACHE_NAME);
			const cached = await cache.match(cacheKey);
			const headers = new Headers(request.headers);
			headers.delete('If-Modified-Since');
			headers.delete('If-None-Match');
			const etag = cached?.headers.get('ETag');
			if (etag) headers.set('If-None-Match', etag);
			const controller = new AbortController();
			const timeout = setTimeout(() => controller.abort(), 2000);
			let response;
			try {
				response = await fetch(request, {
					headers,
					cache: 'no-store',
					signal: controller.signal
				});
			} catch (error) {
				if (cached) return cached;
				throw new Error(`Network failed and file is not cached | cache=${CACHE_NAME} | url=${cacheKey} | error=${error.message}`);
			} finally {
				clearTimeout(timeout);
			}
			if (response.status === 304 && cached) return cached;
			if (response.status === 200 && !response.redirected && response.type === 'basic') {
				if (!response.headers.has('ETag')) {
					console.warn(`[PWA Cache] missing ETag | url=${request.url}`);
				}
				try {
					await cache.put(cacheKey, response.clone());
					if (etag && response.headers.get('ETag') && etag !== response.headers.get('ETag') &&
						cacheKey !== pwaManifestUrl && cacheKey !== versionManifestUrl) {
						await notifyPwaUpdate(session).catch(error => {
							console.warn(`[PWA Cache] update notification failed | error=${error.message}`);
						});
					}
				} catch (error) {
					console.error(`[PWA Cache] storage failed | url=${request.url} | error=${error.message}`);
				}
			}
			return response;
		})().finally(() => session.downloads.delete(cacheKey));
		session.downloads.set(cacheKey, download);
	}
	return session.downloads.get(cacheKey).then(response => response.clone());
}

self.addEventListener('install', event => {
	event.waitUntil(self.skipWaiting());
});

self.addEventListener('activate', event => {
	event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', event => {
	const request = event.request;
	const url = new URL(request.url);
	if (request.method !== 'GET' || url.origin !== self.location.origin || request.headers.has('range')) return;
	if (request.mode === 'navigate' && (url.pathname !== scopePath || url.searchParams.get('mode') !== 'pwa')) return;
	const task = (async () => {
		if (request.mode !== 'navigate' && !await isPwaClient(event.clientId)) return { response: fetch(request) };
		const session = request.mode === 'navigate' ? startRequestSession() : requestSession || startRequestSession();
		const cache = await caches.open(CACHE_NAME);
		const cached = await cache.match(request.url);
		const update = loadRequest(request, session);
		return { response: cached || update, update };
	})();
	event.respondWith(task.then(result => result.response));
	event.waitUntil(task.then(result => result.update).catch(error => {
		console.warn(`[PWA Cache] request failed | url=${request.url} | error=${error.message}`);
	}));
});

// Store resources from the first page load, which may precede service worker control.
self.addEventListener('message', event => {
	if (event.data?.type !== 'CACHE_APPLICATION_SHELL') return;
	event.waitUntil((async () => {
		if (!await isPwaClient(event.source?.id)) return;
		const session = requestSession || startRequestSession();
		if (!Array.isArray(event.data.urls)) return;
		const applicationUrl = new URL(event.source.url);
		applicationUrl.hash = '';
		const urls = new Set([applicationUrl.href, ...event.data.urls]);
		await Promise.all([...urls].map(async fileUrl => {
			if (new URL(fileUrl).origin !== self.location.origin) return;
			await loadRequest(new Request(fileUrl), session);
		}));
	})().catch(error => {
		console.warn(`[PWA Cache] application shell failed | error=${error.message}`);
	}));
});
