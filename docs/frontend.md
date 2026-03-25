# Frontend

The platform is a React 18 SPA built with Vite. It is the primary interface for teams reviewing accessibility analysis results, managing snapshots, and collaborating through the AI Co-Pilot and real-time chat.

Optimised for desktop. Not designed for mobile viewports.

---

## Stack

| Layer | Technology |
|---|---|
| Framework | React 18 |
| Build Tool | Vite |
| Language | TypeScript |
| Styling | Tailwind CSS |
| Server State | TanStack Query |
| Client State | Zustand |
| Charts | Recharts |
| DOM Diff | `diff` library + custom renderer |
| Real-time | Socket.io client |
| Deployment | Vercel |

---

## Project Structure

```
apps/platform/src/
├── components/
│   ├── pages/             # Page-level components per route
│   └── ui/                # Reusable UI primitives
├── hooks/                 # Composite feature hooks
├── stores/                # Zustand stores
├── api/                   # TanStack Query definitions + API call functions
└── main.tsx               # Entry point
```

---

## Routes

| Route | Page | Description |
|---|---|---|
| `/` | Landing | Product overview and feature highlights |
| `/login` | Login | Authentication entry point |
| `/signup` | Signup | Account creation |
| `/onboard` | Onboarding | Initial setup flow for new users |
| `/dashboard` | Dashboard | High-level analytics across all tracked websites |
| `/websites` | Website Inventory | Searchable list of all tracked properties |
| `/websites/:id` | Website Detail | Snapshots, accessibility reports, and performance charts for a specific site |
| `/mind/:websiteId` | Website Mind | Visual treemap and DOM tree structure for a site |
| `/chat` | AI Co-Pilot | Dedicated chat interface for the accessibility assistant |
| `/manage` | Team Management | Admin panel for adding, removing, and assigning roles to members |

---

## State Management

The platform uses a hybrid approach — TanStack Query owns all server state and Zustand owns global UI state that does not belong in the URL.

**TanStack Query (server state)**

Used for all data fetching across the platform. Handles caching, background refetching, and loading and error states for:

- Website list and individual website data
- Snapshot history per website
- Accessibility issue results per snapshot
- Team member list and roles

**Zustand (client state)**

Two stores manage global UI concerns:

`useAuthStore` — stores the JWT token and user profile (ID and role). Also handles the auth sync logic with the browser extension, so the platform and extension share the same session where applicable.

`useMemberStore` — manages the Team Management page UI state: which member is currently being edited, form validation states, and temporary form data during edits. Keeps the management page components clean by centralising this logic outside the component tree.

---

## Composite Hook Pattern

Components in the platform do not import individual queries and mutations directly. Instead, feature hooks encapsulate all data dependencies for a given domain and expose a single object with data, actions, and loading states.

For example, `useMembers.ts` provides everything the Team Management page needs — the member list query, the add member mutation, the remove member mutation, and the relevant loading and error states — in a single import. The page component stays thin and focused on rendering.

This pattern is applied consistently across the codebase. It makes components easier to read, easier to test, and means data-fetching logic is co-located with the feature it belongs to rather than scattered across components.

---

## DOM Diff View

The snapshot comparison feature is custom-built. It does not use a black-box diff UI library.

The `SnapshotDiff.tsx` component uses the `diffLines` function from the `diff` library to calculate the delta between two snapshot versions. The resulting deltas are processed by a custom `CodeComparison` utility that renders additions and removals with syntax highlighting, visually similar to a Git diff view with `+` and `-` line markers.

This gives full control over the rendering logic and lets the diff be contextualised around accessibility-relevant DOM changes rather than generic code changes.

---

## Website Mind View

The `/mind/:websiteId` route renders a visual representation of the site's DOM structure. It displays element distribution as an interactive treemap and as a hierarchical tree, giving teams a bird's-eye view of heading structure, link density, and element counts across a captured snapshot.

---

## Environment Variables

Create a `.env` file in `apps/platform/` with the following:

```env
VITE_PUBLIC_BACKEND_URL=http://localhost:4000
VITE_API_URL=http://localhost:4000
```

Both variables point to the backend API. `VITE_API_URL` is used as a fallback in some service configurations. In production both point to the deployed Fly.io backend URL.

---

## Running Locally

```bash
cd apps/platform
pnpm dev
```

Platform runs on `http://localhost:5173`. Ensure the backend is running on port `4000` before starting the platform.

---

## Deployment

The platform is deployed to Vercel. On every push to `main`, GitHub Actions triggers a Vercel deployment automatically.

The `vercel.json` at the repo root contains the Vercel project configuration. The `VITE_PUBLIC_BACKEND_URL` and `VITE_API_URL` environment variables must be set in the Vercel project settings pointing to the production Fly.io backend URL.