<div align="center">

# axeVision

**AI-powered web accessibility analysis. Catch WCAG violations before they ship.**

[![Live Demo](https://img.shields.io/badge/Live_Demo-Visit_Platform-4F46E5?style=for-the-badge)](https://axe-vision-platform.vercel.app)
[![TypeScript](https://img.shields.io/badge/TypeScript-Full_Stack-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![Turborepo](https://img.shields.io/badge/Turborepo-Monorepo-EF4444?style=for-the-badge&logo=turborepo&logoColor=white)](https://turbo.build)

</div>

---

## The Problem

Web accessibility is consistently treated as an afterthought. By the time violations surface through audits or complaints, the cost to fix them is exponentially higher than catching them during development. Existing tools either dump raw WCAG violation lists with zero guidance, or require expensive manual QA to interpret what they mean and how to fix them.

## What axeVision Does

A lightweight Chrome extension parses the DOM of any page you are visiting into a structured content object and sends it to the backend. The backend spins up a headless Puppeteer browser, injects the captured HTML, and runs the full axe-core WCAG rule suite to generate violations. Google Gemini then takes those violations and produces human-readable explanations along with exact code fixes. Everything surfaces in a team dashboard with analytics, an AI co-pilot, real-time org chat, and version-over-version snapshot comparison.

The loop: **capture in the browser → analyze on the backend → fix with AI → track as a team.**

---

## Architecture

axeVision is a **Turborepo monorepo** with four packages sharing TypeScript configs across the stack.

```
axeVision/
├── apps/
│   └── platform/          # React dashboard (Vite + Tailwind)
├── packages/
│   ├── backend/           # Node.js/Express API
│   ├── extension/         # Chrome Extension (Manifest V3)
│   └── shared/            # Shared TypeScript configs
├── docker-compose.yml
├── turbo.json
└── .github/workflows/     # CI/CD pipelines
```

| Package | Role |
|---|---|
| **Extension** | Parses DOM into structured JSON, runs basic regex checks locally, sends snapshot to backend |
| **Backend** | Runs full axe-core analysis via Puppeteer, orchestrates Gemini AI, manages data and real-time events |
| **Platform** | Team dashboard for analytics, AI co-pilot, org chat, RBAC management, and snapshot history |
| **Shared** | TypeScript configs shared across all packages |

---

## Features

**Accessibility Analysis**
Captures up to 150 headings, 100 paragraphs, 75 priority links, and more into a structured content object per snapshot. Full WCAG analysis runs via axe-core injected into a Puppeteer headless browser on the backend. Issues are categorized by severity: Critical, High, Medium, and Low.

**AI-Generated Code Fixes**
Google Gemini receives the actual violation data and generates specific, copy-paste-ready code fixes for each issue. Not generic advice.

**AI Co-Pilot Chat**
A context-aware chatbot that builds its system prompt from the real snapshot data: the URL, issue count, severity breakdown, and issue categories pulled from the database for that specific snapshot. It maintains a rolling conversation history and answers fix-specific questions.

**Snapshot History and DOM Diff**
Snapshots are stored as compressed binary buffers using Node's native `zlib` module, compressing both the HTML content and JSON metadata before writing to MongoDB. Teams can compare two snapshots side-by-side to see what changed between deployments.

**Real-Time Organisation Chat**
Socket.io powers a full chat application at `/chat` with private messaging, group channels, and live typing indicators for team members within the same organisation.

**Redis Caching**
Website lists and accessibility analysis results are cached in Redis, keeping the dashboard fast on repeated visits.

**Role-Based Access Control**
Admin and Member roles enforced via dedicated backend middleware on protected routes. Admins manage team members and websites; members access assigned workspaces.

---

## Tech Stack

| Category | Technologies |
|---|---|
| **Languages** | TypeScript (full-stack) |
| **Frontend** | React 18, Vite, Tailwind CSS, TanStack Query, Zustand, Recharts |
| **Backend** | Node.js, Express, Mongoose, Redis, Socket.io, Puppeteer |
| **AI** | Google Gemini API, axe-core |
| **Database** | MongoDB Atlas |
| **Infrastructure** | Docker, Fly.io, Vercel, GitHub Actions |
| **Monorepo** | Turborepo, pnpm Workspaces |

---

## Getting Started

### Prerequisites

- Node.js >= 18
- pnpm >= 8
- Docker
- MongoDB connection string
- Redis connection string
- Google Gemini API key

### Installation

```bash
git clone https://github.com/talhadevelopes/axeVision.git
cd axeVision

pnpm install

cp packages/backend/.env.example packages/backend/.env
cp apps/platform/.env.example apps/platform/.env
```

Fill in your environment variables in both `.env` files, then:

```bash
pnpm dev
```

Platform runs on `http://localhost:5173` and the API on `http://localhost:4000`.

For loading the Chrome extension locally, see [`docs/extension.md`](./docs/extension.md).

### Docker

```bash
docker-compose up -d
```

The backend is containerised and deployed to Fly.io via Docker through the GitHub Actions CI/CD pipeline.

---

## Try the Demo

The platform is deployed at [axe-vision-platform.vercel.app](https://axe-vision-platform.vercel.app) — optimised for desktop.

A demo account is pre-loaded with real websites, snapshots, and accessibility scan results so you can explore without setting anything up.

```
Email:    demo@axevision.dev
Password: demo@1234
```

---

## Documentation

| Document | Description |
|---|---|
| [`docs/architecture.md`](./docs/architecture.md) | System design, data flow, and component interaction |
| [`docs/backend.md`](./docs/backend.md) | API structure, Docker setup, and Fly.io deployment |
| [`docs/frontend.md`](./docs/frontend.md) | Platform dashboard setup and Vercel deployment |
| [`docs/extension.md`](./docs/extension.md) | Chrome extension build and local installation |

---

## Contributing

Contributions are welcome.

**Branching**
Branch off `main` using one of these prefixes:
- `feature/` for new functionality
- `fix/` for bug fixes
- `chore/` for tooling, config, or dependency updates

**Commits**
One line, present tense, lowercase. Example: `add redis cache invalidation on snapshot delete`

**Before opening a PR**
Run ESLint and Prettier across the affected package. PRs with linting errors will not be merged.

**Pull requests**
Keep PRs focused on a single concern. Describe what changed and why in the PR description.