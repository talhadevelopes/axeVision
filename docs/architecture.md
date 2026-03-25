# Architecture

This document covers the system design, data flow, and component interaction across the axeVision monorepo.

---

## System Overview

axeVision is built as a Turborepo monorepo with four packages. Each package owns a distinct responsibility and they communicate over HTTP and WebSockets. There is no shared runtime state between packages — all coordination happens through the backend API and the MongoDB/Redis data layer.

```
┌─────────────────────────────────────────────────────────┐
│                      Client Layer                        │
├───────────────────────────┬─────────────────────────────┤
│     Chrome Extension      │      Web Platform           │
│   (Capture + Analysis)    │   (Dashboard + Chat)        │
└───────────┬───────────────┴──────────────┬──────────────┘
            │                              │
            │         HTTPS + WSS          │
            │                              │
┌───────────▼──────────────────────────────▼──────────────┐
│                    Backend API                           │
│           Node.js / Express / Socket.io                  │
│                                                          │
│   ┌──────────────┐  ┌─────────────┐  ┌───────────────┐  │
│   │  Auth + RBAC │  │  Analysis   │  │  Real-time    │  │
│   │  Middleware  │  │  Pipeline   │  │  Chat (WS)    │  │
│   └──────────────┘  └──────┬──────┘  └───────────────┘  │
│                             │                            │
│                    ┌────────▼────────┐                   │
│                    │   Puppeteer +   │                   │
│                    │   axe-core      │                   │
│                    └────────┬────────┘                   │
│                             │                            │
│                    ┌────────▼────────┐                   │
│                    │  Gemini AI      │                   │
│                    └─────────────────┘                   │
└──────────────────────────────┬──────────────────────────┘
                               │
              ┌────────────────┼────────────────┐
              │                │                │
     ┌────────▼──────┐ ┌───────▼──────┐ ┌──────▼───────┐
     │  MongoDB Atlas│ │ Redis Cache  │ │  Socket.io   │
     │  (Persistent) │ │  (Results +  │ │  (Rooms +    │
     │               │ │  Websites)   │ │  Presence)   │
     └───────────────┘ └──────────────┘ └──────────────┘
```

---

## Package Responsibilities

### Chrome Extension (`packages/extension`)

The extension is the data entry point for the system. It operates entirely independently from the web platform session — it has its own login form in the popup and stores its JWT in `chrome.storage.local`.

**Auth flow:**
The extension calls the same `/api/auth/login` endpoint as the platform. If the account belongs to multiple organisations, the backend returns a list of member profiles and the extension renders a selection screen before calling `/api/auth/select-member` to get the final scoped JWT. Credentials are persisted in `chrome.storage.local` for auto-login on startup.

**Capture flow:**
When a user triggers a snapshot, a content script is injected into the active tab. It walks the DOM and builds a structured `structuredContent` object capturing up to 150 headings, 100 paragraphs, 75 priority links, images, buttons, forms, and ARIA landmarks. This structured JSON is what gets sent to the backend — not raw HTML alone.

The extension also runs lightweight regex-based checks locally for immediate feedback before the backend responds.

---

### Backend (`packages/backend`)

The backend runs on a single Node.js/Express server. Socket.io is mounted on the same server and the same port.

**Analysis pipeline:**

```
Extension sends structuredContent + raw HTML
          │
          ▼
snapshotService.ts receives the payload
          │
          ├── Compresses HTML with zlib (Gzip) → Binary buffer
          ├── Compresses metadata JSON with zlib → Binary buffer
          └── Saves compressed buffers to MongoDB
          │
          ▼
analysisService.ts picks up the snapshot
          │
          ├── Spins up a Puppeteer headless browser
          ├── Injects the raw HTML into the browser context
          ├── Runs the full axe-core WCAG rule suite
          └── Returns structured violations with selectors + impact
          │
          ▼
geminiService.ts receives the violations
          ├── Sends violation data to Gemini API
          └── Returns human-readable fixes + code suggestions
          │
          ▼
Results saved to MongoDB
Redis cache invalidated for this website
```

**AI Co-Pilot:**
For each chatbot message, `chatService.ts` queries the database to build a context object containing the snapshot URL, total issue count, severity breakdown (Critical / High / Medium / Low), and categorised issue list. This context is injected into Gemini's system prompt before the user message is appended. The last four messages from conversation history are included to maintain continuity within token limits.

**Real-time chat:**
Socket.io handles organisation-scoped chat at `/chat`. Rooms are created per organisation and per direct message pair. The server emits typing indicators and message events to room members. All messages are persisted to MongoDB.

**RBAC middleware:**
A dedicated middleware intercepts requests on protected routes and validates the JWT claim against the member's role in the organisation. Admin routes (team management, member creation) reject requests from Member-role tokens at the middleware level before the controller is reached.

**Caching strategy:**
Redis sits in front of two expensive read paths: the website list for a user and the accessibility results for a snapshot. On write (new snapshot or analysis), the relevant cache keys are invalidated. TTL is set so stale data cannot accumulate beyond a controlled window.

---

### Platform (`apps/platform`)

The web dashboard is a React 18 SPA built with Vite. It is the primary interface for teams reviewing analysis results and collaborating on fixes.

Key responsibilities:

- Fetches snapshot history, issues, and team data via TanStack Query with automatic background refetching
- Renders accessibility issue lists grouped by severity with AI-generated fix suggestions inline
- DOM diff view compares two selected snapshots side-by-side
- AI Co-Pilot panel opens per-snapshot and streams chat with the backend's chatbot endpoint
- `/chat` route renders the real-time org chat powered by Socket.io
- Zustand manages local UI state (selected snapshot, active website, chat room)

The platform is deployed to Vercel and communicates with the backend over HTTPS and WSS.

---

### Shared (`packages/shared`)

Contains shared TypeScript compiler configurations (`tsconfig.json` base) extended by each package. Ensures consistent compiler options across the monorepo without duplication.

---

## Data Flow: End to End

```
1. Developer visits any website in Chrome

2. Opens the axeVision extension popup
   └── Extension checks chrome.storage.local for a valid JWT
   └── If none: renders login form → calls /api/auth/login
   └── If multiple orgs: renders member selection → calls /api/auth/select-member

3. Developer clicks "Capture Snapshot"
   └── Content script walks the DOM
   └── Builds structuredContent object (headings, links, paragraphs, etc.)
   └── Sends structuredContent + raw HTML to POST /api/snapshots

4. Backend receives snapshot
   └── Compresses HTML + metadata with zlib
   └── Saves compressed buffers to MongoDB

5. Developer clicks "Analyse"
   └── Backend spins up Puppeteer headless browser
   └── Injects HTML → runs axe-core WCAG suite
   └── Sends violations to Gemini → gets code fixes back
   └── Saves AccessibilityIssue documents to MongoDB
   └── Invalidates Redis cache for this website

6. Developer opens Platform dashboard
   └── TanStack Query fetches website list (Redis cache hit if warm)
   └── Selects snapshot → fetches issues (Redis cache hit if warm)
   └── Reviews issues with AI-generated fixes inline

7. Developer opens AI Co-Pilot for this snapshot
   └── chatService builds context from DB (URL, counts, categories)
   └── Injects context into Gemini system prompt
   └── Streams response back to the Co-Pilot panel

8. Team member opens /chat
   └── Socket.io connects → joins org room
   └── Sends/receives messages in real time with typing indicators
```

---

## Infrastructure

| Service | Platform | Notes |
|---|---|---|
| Platform (frontend) | Vercel | Auto-deploys from `main` via GitHub Actions |
| Backend API | Fly.io | Containerised via Docker, deployed through GitHub Actions CI/CD |
| Database | MongoDB Atlas | Stores snapshots (compressed), issues, users, messages |
| Cache | Redis | Caches website lists and analysis results |
| Container Registry | Docker Hub | Backend image built and pushed by GitHub Actions |

The GitHub Actions workflow builds the backend Docker image, pushes it to Docker Hub, and triggers a Fly.io deployment. The frontend is deployed to Vercel independently on the same push to `main`.

---

## Security

Authentication across both the extension and the platform uses the same JWT-based system. Tokens are scoped to a specific member profile within an organisation, so a token from Org A cannot access resources belonging to Org B.

Backend security layers applied globally:

- `helmet` for HTTP header hardening
- `cors` restricted to known client origins
- `express-mongo-sanitize` to prevent NoSQL injection
- `hpp` to block HTTP parameter pollution
- Rate limiting on auth and analysis endpoints
- `bcryptjs` for password hashing at rest