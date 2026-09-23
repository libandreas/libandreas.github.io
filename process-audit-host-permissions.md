# Process Audit: Chrome Host Permissions and Cross Origin Requests

## Scope

This is a static audit of the current `host_permissions`, cross origin `fetch()` calls, LLM endpoints, remote images, URL reading and related legacy files.

This audit does not change `manifest.json` or any runtime flow. Its purpose is to show what currently depends on `<all_urls>`, what can work through normal server CORS, what can become optional, and what is no longer loaded by the application.

## Short conclusion about LLM endpoints

The assumption that LLM endpoints normally support CORS is partly correct, but it is not a safe universal rule.

An OpenAI compatible endpoint promises a compatible request and response format. It does not promise compatible CORS headers. A browser call containing `Authorization` and JSON usually causes a CORS preflight. The server must allow the extension origin, method and request headers. Many hosted providers support this, but a custom proxy, a self hosted endpoint, Ollama, LM Studio or another compatible server may not.

Therefore:

1. An LLM call does not inherently require a Chrome host permission when its server correctly supports browser CORS.
2. In an extension page such as the Ceres sidebar, a matching host permission lets Chrome perform the cross origin request even when the server does not expose suitable CORS headers.
3. Without `<all_urls>`, the sidebar LLM calls can still work, but every configured endpoint becomes dependent on its own CORS configuration.
4. Content scripts are always subject to the web page origin and CORS. A host permission does not give a content script the same cross origin bypass that an extension page or service worker receives.

The correct classification for the dynamic LLM endpoints is therefore **conditional**. They do not always need host permission, but removing it can break endpoints that currently work only because Ceres has `<all_urls>`.

## Two different broad URL declarations

The manifest currently has two separate `<all_urls>` declarations. They must not be treated as the same permission.

| Manifest field | Current value | Purpose | Can it be made optional? |
|---|---|---|---|
| `host_permissions` | `<all_urls>` | Gives the sidebar and service worker privileged network access to matching origins. It also permits access to sensitive tab metadata for matching pages. | Yes. It can be replaced with `optional_host_permissions`, fixed required hosts, or a combination of both. The code must request the relevant origin before the privileged request. |
| `content_scripts.matches` | `<all_urls>` | Statically injects the listed Ceres content scripts and CSS into matching pages. | Not through `optional_host_permissions`. This is a separate static injection declaration. Removing the host permission alone does not remove this broad page access or its Chrome warning. |

The current `activeTab`, optional `tabs`, and optional `history` permissions are also separate from both declarations.

## Status legend

| Status | Meaning |
|---|---|
| Active | The file is loaded and the flow has a current caller. |
| Conditional | Active, but host permission is only needed when the remote server does not allow normal browser CORS. |
| Optional origin recommended | The feature needs arbitrary or user selected hosts, so the exact origin can be requested only when needed. |
| Fixed host | The destination is known and can be declared narrowly instead of using `<all_urls>`. |
| Not required | The request is local, `data:`, `blob:`, or otherwise does not need remote host access. |
| Orphaned or development only | No normal application loader or caller was found in the repository. |

## Detailed audit by file

### 1. `manifest.json`

**Current declaration:** `host_permissions: ["<all_urls>"]`.

**Current effect:** The sidebar and service worker can fetch from any HTTP or HTTPS origin without depending on that server's CORS policy. It also broadly grants host access used by some Chrome APIs.

**Separate active declaration:** `content_scripts.matches: ["<all_urls>"]` injects the Ceres page tools into every matching page and all matching frames. This remains broad even if `host_permissions` is removed or made optional.

**Status:** Active and broad.

**Recommended direction:** Replace the required catch all host permission only after each active network flow below has either a fixed host, an optional exact origin request, or a deliberate CORS only fallback.

### 2. `service-worker.js`

#### Remote image download

`DOWNLOAD_IMAGE` fetches the supplied image URL before downloading or processing it.

**Host need:** Dynamic. A normal remote image server often does not allow browser CORS, so the current host permission can be the reason the download succeeds.

**Recommended classification:** Optional exact image origin. `data:` and `blob:` images do not need remote host permission.

**Status:** The handler exists, but no repository sender was found during this audit. Treat it as an unconfirmed legacy handler until an external sender is identified.

#### Generic CORS request relay

`CORS_REQUEST` accepts `message.url` and fetches it from the privileged service worker.

**Host need:** Dynamic and currently covered by `<all_urls>`.

**Security note:** Chrome specifically advises extensions not to expose an arbitrary privileged URL fetcher to content scripts. The current handler checks the sender origin, but the destination itself is still arbitrary. If this flow remains, it should accept only an allowed or previously granted destination origin.

**Status:** The handler exists, but no repository sender was found. It is currently orphaned inside this repository.

#### OpenRouter authorization key request

The OpenRouter authorization flow fetches `https://openrouter.ai/api/v1/auth/keys`.

**Host need:** Fixed host. This does not justify `<all_urls>`.

**Recommended classification:** Narrow `https://openrouter.ai/*` access, required only if this login flow must work without depending on OpenRouter CORS.

**Status:** Active authorization flow.

### 3. `www/api-manager.js`

This file requests the configured provider's model list and the OpenRouter image model list. The configured model endpoint is dynamic and normally includes an `Authorization` header.

**Host need:** Conditional for the configured provider. If its `/models` endpoint supports browser CORS, the call works without host permission. Otherwise the sidebar needs matching host access. OpenRouter is a known fixed host.

**Recommended classification:** Optional exact configured endpoint origin plus narrow OpenRouter access if required by that feature.

**Status:** Active in the sidebar through `www/index.html`.

### 4. `www/chat.js`

This is the main sidebar LLM flow. It sends chat completion payloads to the configured endpoint. It also calls the configured image generation endpoint and can retrieve generated remote images.

**Host need for chat completion:** Conditional. Hosted endpoints with correct CORS can work without Chrome host permission. OpenAI compatible format alone does not guarantee this.

**Host need for image generation:** Conditional for the API endpoint, then potentially dynamic for the returned image URL. The API origin and image origin can be different.

**Recommended classification:** Request the exact configured API origin only if the chosen policy is to preserve endpoints without CORS. Request a generated image origin only at the point where Ceres must fetch that remote image.

**Status:** Active primary sidebar flow.

### 5. `www/explain.js`

This file sends text to the configured LLM completion endpoint for the Explain flow.

**Host need:** Conditional in the sidebar. The same file is also statically injected as a content script, where Chrome host permission does not bypass CORS.

**Important result:** The content script version already requires the configured endpoint to support normal browser CORS. The sidebar version currently has the additional `<all_urls>` privilege.

**Status:** Active in both the sidebar and page context.

### 6. `www/prompts.js`

This file sends custom prompt requests to the configured completion endpoint.

**Host need:** Conditional. Its content script execution already depends on endpoint CORS, while extension page execution can currently use `<all_urls>`.

**Status:** Active in both contexts.

### 7. `www/summary.js`

This file sends page or selected content to the configured completion endpoint for summaries.

**Host need:** Conditional with the same split between content script CORS and sidebar host access.

**Status:** Active in both contexts.

### 8. `www/translate-llm.js`

This file sends translation requests to the configured completion endpoint.

**Host need:** Conditional. When injected into a page it cannot use host permission to bypass that page's CORS restrictions.

**Status:** Active content script and shared LLM flow.

### 9. `www/transcribe-api-only.js`

This file sends transcription related LLM requests to the configured endpoint.

**Host need:** Conditional. It is statically injected into page context and therefore already relies on endpoint CORS there.

**Status:** Active content script flow.

### 10. `www/voice-command.js`

This file sends voice command interpretation requests to the configured LLM endpoint.

**Host need:** Conditional. Page context requires server CORS regardless of the manifest host permission.

**Status:** Active content script flow.

### 11. `www/papaki.js`

#### DuckDuckGo search

Navigation search builds a DuckDuckGo URL and reads its result page.

**Host need:** Fixed search host for the initial search page. Following result URLs creates dynamic target origins.

**Recommended classification:** Narrow DuckDuckGo access for search, then optional exact origin for a selected result when network reading is required.

**Status:** Active Navigation mode flow.

#### Read URL and PDF network fallback

Read URL first tries to reuse readable content from an open tab. When that is unavailable, it fetches the requested URL. PDF reading has a similar remote target dependency.

**Host need:** This is the strongest real reason for broad host access. Arbitrary websites commonly do not expose page HTML through permissive CORS. Without matching host permission, many network fallbacks will fail even though reading an already open tab can still succeed.

**Recommended classification:** Optional exact origin requested for the target URL only when the network fallback is about to run. A denial should leave the existing failure result for the tool so the LLM can continue.

**Status:** Active manual Read URL and LLM Navigation tool flow.

### 12. `common/message-manager.js`

#### Gumroad license verification

The license flow posts to `https://api.gumroad.com/v2/licenses/verify`.

**Host need:** Fixed host or normal Gumroad CORS. It does not justify `<all_urls>`.

**Recommended classification:** Narrow `https://api.gumroad.com/*` access if reliable extension page verification must not depend on CORS.

#### Ceres version and news checks

The application fetches `https://ceres-assistant.com/versions.php` for version messages and notifications.

**Host need:** Fixed first party host. It does not justify `<all_urls>`.

**Recommended classification:** Narrow `https://ceres-assistant.com/*` access, or rely on first party CORS if the endpoint is intentionally configured for browser clients.

**Status:** Active shared application flow.

### 13. `www/tab-inner.js`

This sidebar file fetches image sources when converting blob images and when copying a regular remote image.

**Host need:** `blob:` conversion is local and needs no host permission. A regular remote image URL is dynamic and may fail normal CORS.

**Recommended classification:** No permission for blob images. Optional exact origin for a regular remote image only when the copy action needs to fetch it.

**Status:** Active in the sidebar through `www/index.html`.

### 14. `www/tab.js`

The inspected fetch reads a returned Base64 or data URL during the page tool flow.

**Host need:** None when the value is a `data:` URL. It does not justify `<all_urls>`.

**Status:** Active content script flow.

### 15. `common/functions.js`

The legacy `is_working(url)` helper performs an XMLHttpRequest `HEAD` check for dynamically constructed site URLs. It is called by old site path detection functions in the same file.

**Host need:** Dynamic if those functions are loaded from an extension page. In a normal page or content script it still depends on server CORS.

**Status:** Legacy shared helper. It has internal callers, but this audit did not find an HTML loader for `common/functions.js` in the current extension flow. It should not be used to justify a required broad permission without first confirming an external loader.

### 16. `www/sync.js`

This file contains several first party Ceres synchronization requests and generic upload helpers that accept a URL.

**Host need:** Fixed Ceres host for first party synchronization and dynamic host for the generic upload helpers.

**Status:** Orphaned in the current extension package. No active HTML or JavaScript loader for `www/sync.js` was found. A setup reference is commented out. These calls should not determine current manifest permissions unless another environment loads this file externally.

### 17. `www/test-llm.js`

This file sends a test payload to a user supplied LLM endpoint.

**Host need:** Conditional on endpoint CORS, like the normal LLM calls.

**Status:** Development or orphaned file. No active application loader was found. It should not determine production permissions.

### 18. `www/test-codex.js`

This file calls a configured OAuth token URL and a Codex endpoint for its standalone test flow.

**Host need:** Fixed or configured test hosts, depending on the test settings.

**Status:** Development or orphaned file. No active application loader was found. It should not determine production permissions.

## What has already been removed and what remains

The previous tabs cleanup removed unused `chrome.tabs` relays, fallbacks and handlers. That work did not remove `<all_urls>` because tab API permission and host permission are different concerns.

In this host audit:

1. No host permission code has been removed yet.
2. The generic service worker `CORS_REQUEST` and `DOWNLOAD_IMAGE` handlers remain in the code, but no repository senders were found.
3. `www/sync.js`, `www/test-llm.js` and `www/test-codex.js` remain as files, but no normal extension loader was found.
4. The active Read URL network fallback still has a legitimate dynamic host requirement when the target site does not support CORS.
5. The active LLM calls have a conditional host requirement, not a universal one.

## What would happen if `<all_urls>` were removed immediately

1. LLM endpoints with correct browser CORS would continue working.
2. LLM endpoints without correct preflight support could fail in the sidebar even if they are otherwise OpenAI compatible.
3. Content script LLM calls would behave as they already do because content scripts never receive the extension page CORS bypass.
4. Read URL network fallback would fail on many arbitrary websites. Open tab reading could still work when page content is already available through the content script.
5. Remote image fetch and copy could fail on image hosts without CORS.
6. Fixed Ceres, Gumroad and OpenRouter calls would depend on those servers' CORS unless their exact hosts remain declared.
7. The content scripts would still be injected on `<all_urls>`. Removing only `host_permissions` would not eliminate the broad page access warning.

## Recommended migration without over engineering

### Phase 1: Remove dead permission consumers

Confirm and then remove the orphaned `CORS_REQUEST` and `DOWNLOAD_IMAGE` handlers if no external environment uses them. Keep development files out of the production permission decision.

### Phase 2: Keep only narrow fixed hosts that require reliability

Evaluate the fixed first party Ceres endpoint, OpenRouter authorization, Gumroad verification and DuckDuckGo search separately. A fixed host can be declared narrowly if its feature must not depend on CORS.

### Phase 3: Declare dynamic origins as optional

Use `optional_host_permissions` for HTTP and HTTPS origins. Request only the exact origin needed for:

1. Read URL or PDF network fallback.
2. A configured LLM endpoint that fails or is known not to support browser CORS.
3. A remote generated image that must be fetched by Ceres.

The existing permission UI wrapper can receive an origin instead of creating a second permission system.

### Phase 4: Keep CORS as the first path for LLM calls

For LLM endpoints, the least intrusive behavior is to try the normal request first. If it succeeds, no host permission is needed. A permission request should only be introduced when the product deliberately wants to support an endpoint whose CORS configuration blocks the browser request. This avoids asking every user for broad access merely because Navigation mode exists.

### Phase 5: Audit static page injection separately

`content_scripts.matches: ["<all_urls>"]` needs its own design decision. Optional host permission alone cannot replace static content script matching. Changing this would affect selection tools, voice tools, page context, open tab reading and sidebar communication, so it should be a separate audit and implementation.

## Final recommendation

Do not keep `<all_urls>` solely for LLM API calls. Most hosted browser compatible endpoints can be allowed to use their normal CORS behavior, but compatibility must be tested per provider because OpenAI compatible does not mean CORS compatible.

Before removing the required permission, preserve the active Read URL and remote image behavior through exact optional origins, narrow any truly required fixed hosts, and remove the orphaned privileged service worker relays. Treat the separate `<all_urls>` content script declaration as a later independent task.

## Official references

- [Chrome cross origin network requests](https://developer.chrome.com/docs/extensions/develop/concepts/network-requests)
- [Chrome permission declarations and optional host permissions](https://developer.chrome.com/docs/extensions/develop/concepts/declare-permissions)
- [Chrome static content script matching](https://developer.chrome.com/docs/extensions/reference/manifest/content-scripts)
- [Official OpenAI JavaScript SDK browser support warning](https://github.com/openai/openai-node)
