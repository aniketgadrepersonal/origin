# Event Management App

A full-stack event management application built with Next.js. Supports creating and managing events, registering attendees, and enforcing capacity and scheduling business rules.

---

## Table of Contents

- [Architecture Overview](#architecture-overview)
- [Folder Structure](#folder-structure)
- [API Reference](#api-reference)
- [Business Rules](#business-rules)
- [Local Development](#local-development)
- [Running Tests](#running-tests)
- [Environment Variables](#environment-variables)
- [Deployment](#deployment)
- [Security Practices](#security-practices)
- [Decisions and Trade-offs](#decisions-and-trade-offs)

---

## Architecture Overview

This is a Next.js monorepo using the App Router. The frontend and backend live in the same repository with no external database — data is stored in-memory and resets on every server restart, as required by the exercise spec.

```
Browser (React)
     |
     | fetch()
     v
Next.js API Routes (/app/api/*)
     |
     | calls
     v
Service Layer (lib/events.ts, lib/registrations.ts)
     |
     | reads/writes
     v
In-Memory Store (lib/store/index.ts)
```

Key decisions:

- API routes are thin handlers that parse input, delegate to the service layer, and return a typed response envelope.
- All business logic lives in the service layer, which is completely decoupled from HTTP — making it straightforward to unit test without mocking requests.
- Input validation is a separate layer (`lib/validators`) so it can be reused and tested independently.
- A consistent `ApiResponse<T>` envelope is returned from every endpoint so the frontend handles errors uniformly.

---

## Folder Structure

```
event-management/
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── events/
│   │   │   │   ├── route.ts              # GET /api/events, POST /api/events
│   │   │   │   └── [id]/
│   │   │   │       └── route.ts          # GET /api/events/:id, PATCH /api/events/:id
│   │   │   └── registrations/
│   │   │       ├── route.ts              # POST /api/registrations
│   │   │       └── [id]/
│   │   │           └── route.ts          # DELETE /api/registrations/:id
│   │   ├── layout.tsx                    # Root layout
│   │   └── page.tsx                      # Home page
│   ├── components/
│   │   ├── ui/                           # Shared primitives (Button, Modal, etc.)
│   │   ├── events/                       # Event-specific components
│   │   └── registrations/                # Registration-specific components
│   ├── lib/
│   │   ├── store/
│   │   │   └── index.ts                  # In-memory Map store singleton
│   │   ├── validators/
│   │   │   └── index.ts                  # Pure input validation functions
│   │   ├── utils/
│   │   │   └── api.ts                    # Response builders, parseJsonBody
│   │   ├── events.ts                     # Events service (business logic)
│   │   └── registrations.ts              # Registrations service (business logic)
│   ├── types/
│   │   └── index.ts                      # Shared TypeScript types
│   └── hooks/                            # Custom React hooks
├── __tests__/
│   └── lib/
│       ├── events.test.ts
│       ├── registrations.test.ts
│       └── validators.test.ts
├── next.config.js
├── tsconfig.json
├── jest.config.ts
└── jest.setup.ts
```

---

## API Reference

All responses follow this envelope:

```json
{
  "success": true | false,
  "data": { ... },
  "error": "string — present on failure",
  "message": "string — human-readable status"
}
```

### Events

#### `GET /api/events`

Returns all events sorted by date ascending, each enriched with real-time availability.

**Response 200**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "title": "string",
      "description": "string",
      "date": "ISO 8601",
      "maxCapacity": 50,
      "registrationCount": 12,
      "availableSpots": 38,
      "isFull": false,
      "createdAt": "ISO 8601",
      "updatedAt": "ISO 8601"
    }
  ]
}
```

---

#### `POST /api/events`

Creates a new event.

**Request body**
```json
{
  "title": "string (required, max 200 chars)",
  "description": "string (required)",
  "date": "ISO 8601 (required, must be future)",
  "maxCapacity": "integer > 0 (required)"
}
```

**Response 201** — created event  
**Response 422** — validation errors

---

#### `GET /api/events/:id`

Returns a single event by id.

**Response 200** — event object  
**Response 404** — event not found

---

#### `PATCH /api/events/:id`

Partially updates an event. All fields are optional.

**Request body** (all optional)
```json
{
  "title": "string",
  "description": "string",
  "date": "ISO 8601 (must be future)",
  "maxCapacity": "integer > 0 (cannot be lower than current registration count)"
}
```

**Response 200** — updated event  
**Response 404** — event not found  
**Response 409** — capacity conflict  
**Response 422** — validation errors

---

### Registrations

#### `POST /api/registrations`

Registers a user for an event.

**Request body**
```json
{
  "eventId": "string (required)",
  "userId": "string (required)"
}
```

**Response 201** — registration object  
**Response 404** — event not found  
**Response 409** — past event / at capacity / already registered  
**Response 422** — validation errors

---

#### `DELETE /api/registrations/:id`

Unregisters a user (removes a registration by its id).

**Response 200** — success  
**Response 404** — registration not found

---

## Business Rules

| Rule | Enforcement |
|---|---|
| Cannot register for a past event | `registrations.ts` — checks event date against `Date.now()` |
| Cannot exceed event capacity | `registrations.ts` — counts active registrations before inserting |
| Cannot double-register | `registrations.ts` — checks for existing `(eventId, userId)` pair |
| Cannot reduce capacity below current registrations | `events.ts` — checked on PATCH |
| Event date must be in the future on create/update | `validators/index.ts` |

---

## Local Development

### Prerequisites

- Node.js 18.17 or later
- npm 9 or later

### Setup

```bash
# 1. Clone the repository
git clone <your-repo-url>
cd event-management

# 2. Install dependencies
npm install

# 3. Copy environment variables
cp .env.example .env.local

# 4. Start the development server
npm run dev
```

The app will be available at `http://localhost:3000`.  
API routes are available at `http://localhost:3000/api/*`.

### Quick API smoke test with curl

```bash
# Create an event
curl -X POST http://localhost:3000/api/events \
  -H "Content-Type: application/json" \
  -d '{"title":"Team Lunch","description":"Monthly team lunch","date":"2026-12-01T12:00:00Z","maxCapacity":20}'

# List all events
curl http://localhost:3000/api/events

# Register for an event (replace EVENT_ID)
curl -X POST http://localhost:3000/api/registrations \
  -H "Content-Type: application/json" \
  -d '{"eventId":"EVENT_ID","userId":"user-123"}'
```

---

## Running Tests

```bash
# Run all tests
npm test

# Run in watch mode (re-runs on file change)
npm run test:watch

# Run with coverage report
npm run test:coverage
```

Coverage is collected for `src/lib/**` and `src/app/api/**`. The minimum threshold is 80% across branches, functions, lines, and statements — the build will fail in CI if coverage drops below this.

---

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `ANTHROPIC_API_KEY` | No (for now) | Anthropic API key for AI features added in later phases |

Copy `.env.example` to `.env.local` for local development. Never commit `.env.local` to version control.

---

## Deployment

This project is designed to deploy to Vercel with zero configuration.

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy to preview
vercel

# Deploy to production
vercel --prod
```

A GitHub Actions CI/CD workflow (`.github/workflows/ci.yml`) will be added in a future phase to run tests and lint on every pull request before deploying.

---

## Security Practices

The following OWASP-aligned practices are applied:

- Input validation on all API routes before any business logic runs — prevents injection via malformed payloads.
- Security headers set in `next.config.js`: `X-Content-Type-Options`, `X-Frame-Options`, `Strict-Transport-Security`, `Permissions-Policy`, and `X-XSS-Protection`.
- Safe JSON parsing in `parseJsonBody` — malformed bodies return a 400 rather than crashing the server.
- No sensitive data is logged or exposed in error responses — error messages are human-readable but not stack traces.
- UUIDs are used for all resource ids (via the `uuid` package) to prevent enumeration attacks.
- TypeScript strict mode is enabled — eliminates a class of type-related runtime errors.

---

## Decisions and Trade-offs

**Why Next.js as a monorepo?**  
Single repo, single deployment, shared types between frontend and backend. Reduces the overhead of maintaining two separate projects for an exercise of this scope.

**Why in-memory Maps instead of arrays?**  
O(1) lookups by id without iterating. Arrays would work but Maps are the right tool when id-based access is the primary read pattern.

**Why a service layer separate from route handlers?**  
Route handlers should be thin. Business logic in the service layer is independently testable without HTTP overhead, and it makes a future database swap a single-file change.

**Why PATCH instead of PUT for updates?**  
PUT requires sending the full resource. PATCH is more appropriate when clients only want to change one or two fields, and it maps more naturally to the "partial update" use case.

**What is not in scope (yet)**  
Authentication, persistent storage, rate limiting, and the AI co-host feature are planned for later phases.

**Known limitation: race condition in the in-memory store**  
The business rule checks (is the event full? has this user registered?) are read-then-write operations with no locking. Under concurrent requests, two users can both read `availableSpots > 0`, both pass the capacity check, and both be inserted — exceeding `maxCapacity` by one or more.

The same window exists for the double-register check: two simultaneous requests with the same `(eventId, userId)` pair can both read "not registered yet" and both succeed.

This is acceptable in a single-process in-memory demo, but would be a correctness bug in production. Three approaches, in order of increasing robustness:

1. **Per-event async mutex** — maintain a `Map<eventId, Promise>` and chain each registration operation as a promise, serialising writes per event. Zero external dependencies, works in a single process.
2. **Optimistic concurrency** — add a `version` integer to each event. The check-and-insert step reads the version, performs its checks, then writes only if the version hasn't changed; otherwise retry. Mirrors the pattern used by most SQL ORMs.
3. **Database transaction** — with a real database (e.g. PostgreSQL), wrap the check-and-insert in a serialisable transaction or use `SELECT FOR UPDATE` to hold a row lock for the duration of the write. This is the production-grade solution and one of the primary reasons to graduate from in-memory storage.
