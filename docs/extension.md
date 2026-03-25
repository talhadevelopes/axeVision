# Chrome Extension

The extension is the data entry point for the axeVision ecosystem. It runs as a Chrome Extension built on Manifest V3 and operates entirely independently from the web platform — it has its own authentication flow, its own session storage, and its own UI.

---

## What It Does

When a developer visits any website in Chrome, the extension can capture a structured snapshot of the page's DOM and trigger a full WCAG accessibility analysis — all without leaving the browser. Results appear directly in the popup with severity breakdowns and the actual violating code snippets, before the developer ever opens the dashboard.

---

## Installation

The extension is not published on the Chrome Web Store. It is loaded manually as an unpacked extension during development.

```
1. Clone the repository
2. Open Chrome and navigate to chrome://extensions/
3. Enable Developer Mode using the toggle in the top right
4. Click "Load unpacked"
5. Select the packages/extension folder
6. The axeVision icon will appear in your toolbar
```

---

## UI and Screens

The popup is structured as a single page application that switches between states based on authentication context.

**Auth Required Screen**

If no valid token is found in `chrome.storage.local`, the user sees a "Team Authentication Required" screen. Authentication is handled in a separate `auth.html` window where the user enters team credentials. This keeps the auth flow isolated from the main popup.

**Member Selection Screen**

If the authenticated account belongs to multiple organisations, a member selection screen renders before the main popup. The user picks their active team context and the extension calls `/api/auth/select-member` to receive a scoped JWT for that specific organisation.

**Main Popup — Snapshot Tab**

The primary screen after login. Contains:

- A "Capture Snapshot" button that triggers DOM extraction
- A real-time progress bar during capture
- Immediate feedback after capture showing exact element counts: headings captured, paragraphs captured, links captured, and so on
- A "Team Snapshots" history section showing previously captured snapshots for the current site

**Main Popup — Accessibility Tab**

A dedicated analysis screen containing:

- A "Run Accessibility Check" button
- A live log terminal that updates in real time as analysis progresses
- Instant display of basic regex check results (missing alt text, missing lang attributes, etc.) before the backend responds
- Progressive appending of full axe-core results once the backend analysis completes, rendered as a severity summary (Critical / High / Medium / Low) with the actual violating HTML snippets inline

---

## DOM Capture

When "Capture Snapshot" is triggered, a content script is injected into the active tab. It walks the DOM and builds a `structuredContent` object with the following caps:

| Element Type | Cap | Data Captured |
|---|---|---|
| Headings | 150 | Tag level, text content |
| Paragraphs | 100 | Text content |
| Links | 75 (priority) | href, text |
| Images | — | src, alt text |
| Buttons | 30 | Display text |
| Form inputs | 50 | type, name, placeholder |
| Forms | 20 | action, method |
| ARIA landmarks | — | Role, label |

In addition to element data, the capture records `captureTime` in milliseconds and `totalElements` count to monitor the extension's performance impact on the browser.

This structured JSON — not raw HTML alone — is what gets sent to the backend. Sending structured data rather than a raw HTML string makes the backend analysis more efficient and reduces payload size.

---

## Accessibility Analysis Flow

```
User clicks "Run Accessibility Check"
        │
        ▼
accessibility.js runs local regex checks immediately
        ├── Checks for missing alt attributes on images
        ├── Checks for missing lang attribute on <html>
        └── Renders instant results in the live log terminal

        │
        ▼
Extension sends structuredContent + raw HTML to backend
POST /api/websites/:id/accessibility

        │ (while waiting)
        ▼
Live log terminal updates: "Analysing with axe-core..."

        │
        ▼
Backend responds with full axe-core violation list

        │
        ▼
Extension appends results to the live log:
        ├── Severity summary: Critical / High / Medium / Low counts
        └── Detailed list with selector, impact, and HTML context snippet per violation
```

---

## Authentication

The extension uses the same JWT-based auth system as the platform but maintains a completely separate session stored in `chrome.storage.local`.

**Login flow:**

1. User enters team email and password in `auth.html`
2. Extension calls `POST /api/auth/login`
3. If the account belongs to one organisation, a JWT is returned directly and stored in `chrome.storage.local`
4. If the account belongs to multiple organisations, the server returns a list of member profiles and the extension renders the member selection screen
5. User selects a profile, extension calls `POST /api/auth/select-member`, receives a scoped JWT

**Auto-login on startup:**

Each time the extension popup opens, `AuthManager.autoLogin()` runs. It checks `chrome.storage.local` for an existing token first. If none is found, it attempts to re-login using saved credentials. If saved credentials result in a multi-member response, the member selection screen is shown again. Credentials are persisted across sessions so the user does not need to log in on every browser restart.

**Auth headers:**

All API calls from the extension include `Authorization: Bearer <token>` assembled by `AuthManager.getAuthHeaders()`. The backend CORS configuration explicitly allows `chrome-extension://` origins so these requests are not blocked.

---

## Structure

```
packages/extension/
├── manifest.json              # MV3 extension config
├── popup.html                 # Main popup entry point
├── auth.html                  # Separate auth window
├── popup.css                  # Shared styles
└── src/
    ├── core/
    │   └── auth.js            # AuthManager class
    ├── features/
    │   ├── snapshot.js        # DOM capture + structuredContent builder
    │   └── accessibility.js   # Local checks + backend analysis trigger
    └── ui/
        ├── auth-ui.js         # Auth screen logic
        └── member-selection.js # Member picker screen logic
```