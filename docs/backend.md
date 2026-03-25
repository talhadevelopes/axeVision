# Backend

The backend is a Node.js/Express API server. Socket.io is mounted on the same HTTP server and the same port. It handles accessibility analysis, AI orchestration, real-time chat, authentication, and data persistence.

---

## Stack

| Layer | Technology |
|---|---|
| Runtime | Node.js 20+ |
| Framework | Express |
| Language | TypeScript |
| Database | MongoDB Atlas via Mongoose |
| Cache | Upstash Redis (REST-based) |
| Real-time | Socket.io |
| Analysis | Puppeteer + axe-core |
| AI | Google Gemini API |
| Auth | JWT + bcryptjs |
| Containerisation | Docker |
| Deployment | Fly.io |

---

## Project Structure

```
packages/backend/src/
├── controllers/       # Request handlers, one per resource
├── routes/            # Route definitions with middleware applied
├── models/            # Mongoose schemas
├── middleware/        # Auth, RBAC, validation
├── services/          # Business logic: analysis, AI, chat, snapshots
├── utils/
│   ├── database.ts    # MongoDB connection
│   ├── redis.ts       # Upstash Redis client
│   └── chat.ts        # Socket.io initialisation
├── types/
│   └── response.ts    # Unified sendSuccess / sendError helpers
└── server.ts          # Entry point
```

---

## API Routes

All routes are prefixed with `/api`.

| Route | Resource |
|---|---|
| `/api/auth` | Login, member selection, token management |
| `/api/websites` | Website CRUD |
| `/api/websites/:id/snapshots` | Snapshot capture and history per website |
| `/api/websites/:id/accessibility` | Analysis results per website |
| `/api/accessibility` | Standalone accessibility endpoints (chatbot context, issue lookup) |
| `/api/members` | Team member management (Admin only) |
| `/api/chat` | AI Co-Pilot chatbot per snapshot |
| `/api/messages` | Org chat message history |
| `GET /api/health` | Health check — verifies DB connection and returns timestamp |

---

## Response Format

Every endpoint returns a unified response shape via the `sendSuccess` and `sendError` helpers.

```typescript
// Success
{
  "success": true,
  "message": "optional message",
  "data": { }
}

// Error
{
  "success": false,
  "message": "error description",
  "code": "ERROR_CODE",
  "details": { }
}
```

---

## Authentication and RBAC

JWT tokens are issued on login and scoped to a specific member profile within an organisation. A dedicated middleware intercepts all protected routes and validates the token claim against the member's role before the controller is reached.

Two roles exist:

- **Admin** — full access including member management, website creation, and team settings
- **Member** — read and analysis access within their assigned organisation

The CORS configuration explicitly allows both the platform origin (`CLIENT_URL`) and `chrome-extension://` origins so the extension and dashboard can both reach the API with credentials.

The request body size limit is set to `50mb` to accommodate DOM snapshot payloads.

---

## Analysis Pipeline

```
POST /api/websites/:id/snapshots
        │
        ▼
snapshotService.ts
        ├── Receives structuredContent + raw HTML from extension
        ├── Compresses HTML with Node zlib (Gzip) → binary buffer
        ├── Compresses metadata JSON with zlib → binary buffer
        └── Saves compressed buffers to MongoDB

POST /api/websites/:id/accessibility (trigger analysis)
        │
        ▼
analysisService.ts
        ├── Decompresses snapshot buffers from MongoDB
        ├── Spins up Puppeteer headless browser
        ├── Injects raw HTML into browser context
        ├── Runs full axe-core WCAG rule suite
        └── Returns violations with selectors, impact, and WCAG tags

        │
        ▼
geminiService.ts
        ├── Receives structured violations
        ├── Sends to Gemini API with prompt requesting code-level fixes
        └── Returns human-readable explanations + copy-paste code fixes

        │
        ▼
Results saved as AccessibilityIssue documents in MongoDB
Redis cache invalidated for this website's analysis results
```

---

## AI Co-Pilot

Each chatbot request to `/api/chat` triggers a context build before Gemini is called:

1. Query MongoDB for the target snapshot (URL, timestamps)
2. Query MongoDB for all AccessibilityIssue documents tied to that snapshot
3. Calculate severity breakdown and issue categories
4. Inject this context as a structured system prompt
5. Append the last four messages from conversation history
6. Send to Gemini and stream the response back

This means the Co-Pilot answers are always grounded in the actual issues found in that specific snapshot — not generic accessibility advice.

---

## Real-Time Chat

Socket.io is initialised via `initChatSockets(io, redisClient)` on the same HTTP server as Express. It handles organisation-scoped messaging with:

- Private direct message channels between two members
- Group channels scoped to the organisation
- Live typing indicator events
- Message persistence to MongoDB via the messages model
- Redis used for presence and active room state

---

## Caching

Upstash Redis (REST-based) is used as a cache layer over two read-heavy paths:

- **Website list** — cached per user, invalidated on website create/delete
- **Accessibility results** — cached per snapshot, invalidated when a new analysis runs

Using Upstash means no persistent Redis instance to manage — the client communicates over HTTPS using a REST token.

---

## Security Layers

Applied globally in this order on every request:

| Middleware | Purpose |
|---|---|
| `helmet` | Sets secure HTTP headers |
| `hpp` | Prevents HTTP parameter pollution |
| `express-mongo-sanitize` | Strips `$` and `.` operators from request body to block NoSQL injection |
| `cors` | Restricts origins to platform URL and chrome-extension scheme |
| JWT middleware | Validates token and attaches member context to `req` |
| RBAC middleware | Enforces role check before controller is reached |

Rate limiting is applied on auth and analysis routes to prevent abuse.

---

## Environment Variables

Create a `.env` file in `packages/backend/` with the following:

```env
# Server
PORT=4000
CLIENT_URL=http://localhost:5173

# Auth
JWT_SECRET=your_jwt_secret_min_32_chars

# Database
MONGO_URI=mongodb+srv://user:pass@cluster.mongodb.net/axevision

# Cache (Upstash Redis)
UPSTASH_REDIS_REST_URL=https://your-upstash-url.upstash.io
UPSTASH_REDIS_REST_TOKEN=your_upstash_token

# AI
AI_API_KEY_CHATBOT=your_gemini_key
AI_API_KEY_RECC=your_gemini_key
AI_API_KEY_CODE_FIX=your_gemini_key
```

Three separate Gemini keys are used to distribute load across the chatbot, recommendations, and code fix endpoints independently without hitting rate limits on a single key.

---

## Running Locally

```bash
cd packages/backend
pnpm dev
```

API runs on `http://localhost:4000`. Health check available at `http://localhost:4000/api/health`.

---

## Docker

A `Dockerfile` exists in `packages/backend/`. To build and run the container directly:

```bash
docker build -t axevision-backend -f packages/backend/Dockerfile .
docker run -p 4000:4000 --env-file packages/backend/.env axevision-backend
```

To run the full stack locally with Docker Compose from the repo root:

```bash
docker-compose up -d
```

---

## Deployment

The backend is deployed to Fly.io via Docker through the GitHub Actions CI/CD pipeline. On every push to `main`:

1. GitHub Actions builds the backend Docker image
2. Pushes the image to Docker Hub
3. Fly.io pulls the latest image and redeploys

Fly configuration lives in `fly.toml` at the repo root. The server implements graceful shutdown on `SIGTERM` and `SIGINT`, closing open connections and disconnecting from MongoDB before exiting. A 10 second timeout forces exit if shutdown stalls.