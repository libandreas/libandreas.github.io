# Process Audit: Chrome Tabs

## Scope

This is a static audit of every current `chrome.tabs` use in the repository. A flow is marked **Dead** when its handler or function has no caller or sender anywhere in the repository. It is marked **Nearly dead** when the main flow is reachable but the specific `chrome.tabs` fallback is redundant or normally unreachable.

External callers that are not stored in this repository could change the classification of a message handler.

## Cleanup completed

The first two approved cleanup steps have been applied:

- Removed the unused prompt trace helper.
- Removed the unused progress relay helper and its message handlers.
- Removed the uncalled `CAPTURE_ALL_OPEN_TABS` handler.
- Removed the uncalled legacy audio and OCR forwarding handlers.
- Removed the uncalled Index, Example 1 and Example 2 sidebar handlers.
- Removed the uncalled service-worker selection scanner.
- Removed the three uncalled active-tab/context helpers from `www/chat.js`.
- Removed the redundant `GET_BROWSER_TABS` fallback from both `www/papaki.js` and `service-worker.js`.

The active Papaki open-tab path was deliberately preserved. `fetchFilesForAutocomplete()` still calls `fetchBrowserTabs()` directly for the `@` and picker UI, and `readUrlContent()` still prefers a matching open tab before network fetch.

## Permission conclusion

The required `"tabs"` permission has been removed from `manifest.json`. It is now declared only in `optional_permissions` and is requested natively when the user types `@` or opens the `+` picker.

The `chrome.tabs` namespace itself does not require the `"tabs"` permission. The permission mainly exposes sensitive `Tab` fields such as `url`, `title`, and `favIconUrl`. `fetchBrowserTabs()` now verifies that the optional permission is granted before querying and displaying open tabs. If permission is denied, the picker continues without browser-tab results.

`readUrlContent()` does not request the optional permission. It attempts the existing open-tab path when tab metadata is available and naturally falls back to network fetch when no matching tab can be resolved or read. Calls that only need a tab ID, send a message, create a tab, open the side panel, or capture through existing `activeTab` access do not independently require `"tabs"`.

References:

- [Chrome tabs API](https://developer.chrome.com/docs/extensions/reference/api/tabs)
- [Chrome permissions list](https://developer.chrome.com/docs/extensions/reference/permissions-list)
- [Chrome host permissions](https://developer.chrome.com/docs/extensions/develop/concepts/declare-permissions#host-permissions)

## Numbered audit table

| No. | File and location | API use | Process and caller | Status | Is `"tabs"` permission needed? | Exact reason |
|---:|---|---|---|---|---|---|
| 1 | Formerly in `service-worker.js` | `tabs.sendMessage()` | Unused `emitPromptApiTraceToTab()` helper. | **❌ Removed** | No | It had no caller. |
| 2 | `service-worker.js:37-70`, `manifest.json:40-53` | `tabs.query()`, `tabs.sendMessage()` | Keyboard commands find the active tab and send floating Chat or Transcript commands. The manifest currently declares only `trigger-selection-chat` and `trigger-selection-transcript`; four additional service-worker branches have no manifest command. | **Active, with stale branches** | No | The two declared commands use only the active tab ID and content-script messaging. The Explain, Scan and Replay command branches are currently unreachable. |
| 3 | Formerly in `service-worker.js` | `tabs.sendMessage()`, `tabs.query()` | Unused `relayProgressMessageToTab()` and AI progress handlers. | **❌ Removed** | No | No repository sender existed. |
| 4 | Formerly in `service-worker.js` | `tabs.query({})`, `tabs.sendMessage()` | Unused `CAPTURE_ALL_OPEN_TABS` handler. | **❌ Removed** | No | No sender existed. This was unrelated to Papaki open-tab autocomplete. |
| 5 | Formerly in `service-worker.js` | `tabs.query()`, `tabs.sendMessage()` | Legacy audio start and stop forwarding. | **❌ Removed** | No | No sender existed. Current microphone setup remains active. |
| 6 | Formerly in `service-worker.js` | `tabs.query()`, `tabs.sendMessage()` | Legacy OCR and AI progress forwarding. | **❌ Removed** | No | No sender existed. |
| 7 | `service-worker.js:429-445`; senders in `www/tab.js:898,1991,3859` | Fallback `tabs.query()` followed by `sidePanel.open()` | `OPEN_SIDEBAR` opens Ceres from a content script. | **Active; fallback nearly dead** | No | A content-script sender normally provides `sender.tab.id`, so the active-tab query is only a fallback. Opening the panel requires `"sidePanel"`, not `"tabs"`. |
| 8 | `service-worker.js:448-456`; sender in `www/speak.js:57` | `tabs.create()` | Opens the microphone permission setup page. | **Active** | No | `tabs.create()` is available without the `"tabs"` permission. |
| 9 | Formerly in `service-worker.js` | `tabs.query()`, `sidePanel.setOptions/open()` | Legacy Index, Example 1 and Example 2 sidebar handlers. | **❌ Removed** | No | No sender existed. The active `OPEN_SIDEBAR` flow remains. |
| 10 | Formerly in `service-worker.js` | `tabs.query()`, `tabs.sendMessage()` | Unused service-worker active-selection scanner. | **❌ Removed** | No | No sender existed. Active selection insertion and replacement flows remain. |
| 11 | `service-worker.js:865-897`; sender in `www/tab.js:1994` | `tabs.query()` before `runtime.sendMessage()` | `INSERT_SELECTION_TO_CHAT` stores a selection and notifies the sidebar. | **Active; tabs query unnecessary** | No | The query is used only to attach the active tab ID to a runtime message. `sender.tab.id` is already available because the sender is `tab.js`, and the sidebar notification does not require `chrome.tabs`. |
| 12 | `service-worker.js:926-1005`; sender in `www/tab.js:900` | `tabs.query()` before `runtime.sendMessage()` | `INSERT_IMAGE_TO_CHAT` stores an image and notifies the sidebar. | **Active; tabs query unnecessary** | No | As with selection insertion, `sender.tab.id` can identify the source tab and the runtime broadcast does not require a tabs query. |
| 13 | Formerly in `service-worker.js` and `www/papaki.js` | Duplicate `tabs.query({})` through runtime messaging | Redundant `GET_BROWSER_TABS` fallback. | **❌ Removed** | No | The sidebar calls `chrome.tabs.query({})` directly. Papaki open-tab autocomplete remains active. |
| 14 | `service-worker.js:1064-1098`; callers in `www/tab-inner.js:285,308,693,714` and bridge handling in `extension.js:1303` | `tabs.query()`, `tabs.sendMessage()` | Sends replacement text or images to the active page content script. | **Active** | No | It needs the active tab ID and content-script messaging. It does not read privileged tab metadata. |
| 15 | `service-worker.js:1106-1150`; sender in `www/sync.js:832` | Fallback `tabs.query()` followed by `sidePanel.open()` | Opens the sidebar after the page Connect button is pressed. | **Active; fallback nearly dead** | No | A content-script sender normally supplies `sender.tab.id`. The fallback only finds an ID. The actual panel permission is `"sidePanel"`. |
| 16 | `service-worker.js:1201-1225`; sender in `www/tab.js:706` | `tabs.captureVisibleTab()` | Captures the visible page for the screenshot tool. | **Active** | No | Capture access is supplied by `"activeTab"` or host access. The `"tabs"` permission is not the capture permission. |
| 17 | `service-worker.js:1405-1421` | `tabs.create()` | Opens `www/setup.html` after a new installation. | **Active** | No | Creating a tab does not require the `"tabs"` permission. |
| 18 | Formerly in `www/chat.js` | `tabs.query()`, `tabs.sendMessage()` | Three unused active-tab and page-context helpers. | **❌ Removed** | No | None had a caller. |
| 19 | `www/papaki.js:98-133`, native request paths at `www/papaki.js:2806-2818` and `www/papaki.js:4090-4108` | `permissions.request({permissions: ['tabs']})`, `permissions.contains()`, then `tabs.query({})` | Adds open browser tabs to the `@` autocomplete and `+` picker. | **Active; optional permission implemented** | Yes, only for this optional feature | The permission is requested directly from the keyboard or click gesture. If it is denied, `fetchBrowserTabs()` returns an empty list and the rest of the picker continues. |
| 20 | `www/papaki.js:3084-3340`; callers from LLM Read URL and manual Read URL | `tabs.query({})`, `tabs.get()`, `tabs.sendMessage()` | `readUrlContent()` finds a matching open URL, prefers its authenticated live DOM through `tab.js`, then falls back to network fetch. | **Active and important; no permission prompt** | No hard dependency | This flow deliberately does not request `"tabs"`. It uses accessible tab metadata when available and otherwise continues through the existing network-fetch fallback. |
| 21 | `www/tab.js` loaded by `manifest.json:62-99` | Content-script DOM access and `runtime.sendMessage()` | Reads page DOM, selections and screenshots and receives messages from the service worker/sidebar. It does not call `chrome.tabs`. | **Active** | No | `tab.js` depends on `content_scripts.matches` and host access. It is not the reason for the `"tabs"` permission. |

## Remaining cleanup candidates

1. Replace the redundant active-tab queries in rows 11 and 12 with `sender.tab.id`.
2. Review the fallback active-tab queries in rows 7 and 15.
3. Runtime-test the optional `"tabs"` prompt from both `@` and `+`, including approval, rejection, and previously granted permission states.

## Final assessment

- **Active and important:** open-tab autocomplete, Read URL open-tab matching, keyboard shortcuts, selection/image insertion, replacement, screenshot, microphone setup, install setup, Connect-to-sidebar.
- **Active but contains redundant tabs work:** selection insertion, image insertion and sidebar fallbacks.
- **Removed:** prompt trace relay, capture-all-tabs, legacy audio forwarding, OCR/progress forwarding, legacy example sidebar handlers, service-worker selection scanner, unused `chat.js` active-context helpers and the `GET_BROWSER_TABS` fallback.
- **Optional permission now in use:** `"tabs"` is requested only for the open-tab autocomplete and picker metadata feature.
- **No `"tabs"` prompt:** Read URL, keyboard commands, selection replacement, screenshots, tab creation and side-panel opening.
