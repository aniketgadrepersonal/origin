# Event Management App

A full-stack event management application built with Next.js. Supports creating and managing events, registering attendees, enforcing capacity and scheduling business rules, admin authentication, and AI-assisted event creation.

---

## Table of Contents

- [Architecture Overview](#architecture-overview)
- [Folder Structure](#folder-structure)
- [Local Development](#local-development)
- [Environment Variables](#environment-variables)
- [Running Tests](#running-tests)
- [API Reference](#api-reference)
- [Business Rules](#business-rules)
- [Admin Access](#admin-access)
- [AI Features](#ai-features)
- [Deployment](#deployment)
- [Security Practices](#security-practices)
- [Decisions and Trade-offs](#decisions-and-trade-offs)
- [Future State](#future-state)
- [CI/CD Pipeline](#cicd-pipeline)

---

## Architecture Overview

This is a Next.js 14 monorepo using the App Router. The frontend and backend live in the same repository with no external database — data is stored in-memory and resets on every server restart.

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

Key decisions: API routes are thin handlers that parse input and delegate to the service layer. All business logic lives in the service layer, decoupled from HTTP so it can be unit tested without mocking requests. A consistent `ApiResponse<T>` envelope is returned from every endpoint.

---

## Folder Structure

```
event-management/
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── events/
│   │   │   │   ├── route.ts                      # GET /api/events, POST /api/events
│   │   │   │   └── [id]/route.ts                 # GET, PATCH /api/events/:id
│   │   │   ├── registrations/
│   │   │   │   ├── route.ts                      # POST /api/registrations
│   │   │   │   └── [id]/route.ts                 # DELETE /api/registrations/:id
│   │   │   ├── ai/
│   │   │   │   ├── parse-event/route.ts          # POST — natural language → form fields
│   │   │   │   └── generate-description/route.ts # POST — title → description
│   │   │   └── admin/
│   │   │       ├── login/route.ts                # POST — set admin cookie
│   │   │       ├── logout/route.ts               # POST — clear admin cookie
│   │   │       ├── me/route.ts                   # GET — check admin status
│   │   │       └── events/[id]/registrations/route.ts  # GET — admin registration list
│   │   ├── layout.tsx
│   │   └── page.tsx                              # Main page with admin state
│   ├── components/
│   │   ├── ui/index.tsx                          # Button, Badge, Modal, Toast, Spinner, EmptyState
│   │   ├── events/
│   │   │   ├── EventCard.tsx                     # Card with capacity bar, admin controls
│   │   │   ├── EventForm.tsx                     # Create/edit form with AI assist
│   │   │   └── RegisterPanel.tsx                 # Register (name/email/about me) and unregister flows
│   │   └── admin/
│   │       └── RegistrationsModal.tsx            # Admin-only attendee table
│   ├── hooks/
│   │   ├── useEvents.ts                          # Fetch, create, update events
│   │   └── useRegistrations.ts                   # Register, unregister
│   ├── lib/
│   │   ├── store/index.ts                        # globalThis-safe in-memory Map store
│   │   ├── events.ts                             # Events service
│   │   ├── registrations.ts                      # Registrations service
│   │   ├── admin-auth.ts                         # Admin cookie helper
│   │   ├── ai.ts                                 # Shared Anthropic client
│   │   ├── validators/index.ts                   # Pure input validation
│   │   └── utils/api.ts                          # Response builders, parseJsonBody
│   └── types/index.ts                            # Shared TypeScript types
├── __tests__/
│   ├── lib/                                      # Unit tests (events, registrations, validators)
│   └── api/                                      # Integration tests (events, registrations routes)
├── .env.local                                    # Local env vars (never commit)
├── next.config.js
├── tsconfig.json
└── jest.config.ts
```

---

## Local Development

### Prerequisites

- Node.js 18.17 or later
- npm 9 or later

### Setup

```bash
# 1. Clone the repository
git clone https://github.com/aniketgadrepersonal/origin.git
cd origin

# 2. Install dependencies
npm install

# 3. Create your local environment file
cp .env.example .env.local
```

Open `.env.local` and fill in the values:

```env
# Required for AI features (natural language event creation, description generation)
ANTHROPIC_API_KEY=your_anthropic_api_key_here

# Required for admin login — choose any password
ADMIN_PASSWORD=your_admin_password_here
```

```bash
# 4. Start the development server
npm run dev
```

The app will be available at `http://localhost:3000`.

---

### Getting an Anthropic API key

1. Go to [console.anthropic.com](https://console.anthropic.com) and sign in or create an account.
2. Click **API Keys** in the left sidebar.
3. Click **Create Key**, give it a name, and copy the key — it starts with `sk-ant-`.
4. Paste it into `.env.local` as `ANTHROPIC_API_KEY=sk-ant-...`.
5. Restart the dev server (`Ctrl+C` then `npm run dev`) so Next.js picks up the new variable.

To verify the key is working, open the "+ New event" modal and try the "Create with AI" input. A successful response will pre-fill the form fields.

> **Note:** The AI features use Claude Haiku, which is Anthropic's fastest and most cost-efficient model. Typical usage in development costs fractions of a cent per request.

---

### Corporate / VPN environments

If you're on a corporate network with SSL inspection, Node.js may fail with `unable to get local issuer certificate` when calling the Anthropic API. This happens because the corporate proxy re-signs HTTPS traffic with its own root CA, which Node.js doesn't trust by default (even though your browser does).

The app already sets `NODE_TLS_REJECT_UNAUTHORIZED=0` automatically in development via `src/lib/ai.ts`, which should resolve this without any manual steps. If you still see the error, restart the dev server after adding your API key — the fix only takes effect once the server boots with the key present.

If you prefer a cleaner solution that doesn't disable TLS verification entirely, export your corporate root CA and point Node.js to it:

```bash
# macOS / Linux
NODE_EXTRA_CA_CERTS=/path/to/corporate-ca.crt npm run dev

# Windows PowerShell
$env:NODE_EXTRA_CA_CERTS="C:\path\to\corporate-ca.crt"; npm run dev
```

To find your corporate CA in Chrome: Settings → Privacy and security → Security → Manage certificates → find your company's root CA → export as `.crt`.

### Quick smoke test

```bash
# Create an event
curl -X POST http://localhost:3000/api/events \
  -H "Content-Type: application/json" \
  -d '{"title":"Team Lunch","description":"Monthly team lunch","date":"2027-01-15T12:00:00Z","maxCapacity":20}'

# List all events
curl http://localhost:3000/api/events

# Register for an event (replace EVENT_ID)
curl -X POST http://localhost:3000/api/registrations \
  -H "Content-Type: application/json" \
  -d '{"eventId":"EVENT_ID","name":"Jane Smith","email":"jane@example.com","aboutMe":"Product designer"}'
```

---

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `ANTHROPIC_API_KEY` | For AI features | Anthropic API key (starts with `sk-ant-`). Get one at [console.anthropic.com](https://console.anthropic.com) → API Keys. Restart the dev server after adding it. |
| `ADMIN_PASSWORD` | For admin access | Any string you choose. Hashed with sha256 before storing in cookie — never stored in plain text. |

Copy `.env.example` to `.env.local`. Never commit `.env.local` — it's in `.gitignore`.

---

## Running Tests

```bash
# Run all tests (unit + integration)
npm test

# Watch mode
npm run test:watch

# Coverage report
npm run test:coverage
```

The test suite has two layers: unit tests for the service/validator logic in `__tests__/lib/`, and integration tests for the full API route stack in `__tests__/api/`. See [`__tests__/README.md`](__tests__/README.md) for detail on what each test covers.

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

**Response 200** — array of EventResponse objects (includes `registrationCount`, `availableSpots`, `isFull`)

#### `POST /api/events`

Creates a new event. Requires admin login.

```json
{
  "title": "string (required, max 200 chars)",
  "description": "string (required)",
  "date": "ISO 8601 (required, must be future)",
  "maxCapacity": "integer 1–50 (required)"
}
```

**Response 201** — created event | **422** — validation errors | **400** — malformed JSON

#### `GET /api/events/:id`

**Response 200** — event | **404** — not found

#### `PATCH /api/events/:id`

Partially updates an event. All fields optional. Requires admin login.

**Response 200** — updated event | **404** — not found | **409** — capacity conflict | **422** — validation errors

---

### Registrations

#### `POST /api/registrations`

Registers an attendee for an event.

```json
{
  "eventId": "string (required)",
  "name": "string (required)",
  "email": "string (required, valid email format)",
  "aboutMe": "string (optional)"
}
```

Email is used as the unique identifier for dedup — the same email cannot register for the same event twice.

**Response 201** — registration object (includes `id` — save this to unregister later) | **404** — event not found | **409** — past event / at capacity / already registered | **422** — validation errors

#### `DELETE /api/registrations/:id`

Unregisters an attendee by registration id.

**Response 200** — success | **404** — not found

---

### Admin

#### `POST /api/admin/login`

```json
{ "password": "string" }
```

Sets an httpOnly `admin_token` cookie valid for 8 hours.

**Response 200** — `{ success: true }` | **401** — incorrect password

#### `POST /api/admin/logout`

Clears the admin cookie. **Response 200**

#### `GET /api/admin/me`

**Response 200** — `{ isAdmin: true | false }`

#### `GET /api/admin/events/:id/registrations`

Returns full registration details (name, email, about me) for an event. Requires admin cookie.

**Response 200** — array of Registration objects | **401** — not authenticated | **404** — event not found

---

### AI

#### `POST /api/ai/parse-event`

Parses a natural language event description into structured form fields.

```json
{ "prompt": "team lunch next Friday at noon for 15 people" }
```

**Response 200** — `{ title, description, date (ISO 8601), maxCapacity }` | **500** — AI error

#### `POST /api/ai/generate-description`

Generates a polished event description from a title.

```json
{ "title": "Engineering All-Hands" }
```

**Response 200** — `{ description: "string" }` | **500** — AI error

---

## Business Rules

| Rule | Enforcement |
|---|---|
| Cannot register for a past event | `registrations.ts` |
| Cannot exceed event capacity | `registrations.ts` |
| Cannot double-register (same email, same event) | `registrations.ts` |
| Cannot reduce capacity below current registrations | `events.ts` |
| Event date must be in the future on create/update | `validators/index.ts` |
| Max capacity cannot exceed 50 | `validators/index.ts` + form `max` attribute |

---

## Admin Access

Click "Admin login" in the top-right nav and enter the password set in `ADMIN_PASSWORD`. Once logged in:

- The nav shows an "Admin" badge, a "Log out" button, and a "+ New event" button.
- Each event card shows "Edit" and "Registrations" buttons.
- The Registrations modal shows a full table of attendees: name, email, about me, and registration date.

The admin session is stored in an httpOnly cookie (sha256 of the password) and expires after 8 hours. There is no username — a single shared password is used. For production, replace this with a proper auth provider.

---

## AI Features

The app uses the Anthropic API (`claude-haiku-4-5`) for two features, both accessible in the "+ New event" form:

**Create with AI** — type a natural language description like "product demo next Thursday at 2pm for 30 people" and click "Fill form". The AI parses it into title, description, date, and capacity. All fields are editable before submission. Dates are resolved in Central Time.

**Generate description** — enter a title and click the "✦ Generate" button next to the description field. The AI writes a concise, professional 1–2 sentence description. The button is disabled until a title is entered.

Both features require `ANTHROPIC_API_KEY` to be set. If the key is missing, a clear error is returned. The features are UX enhancements — all business rules are still enforced server-side regardless of AI input.

---

## Deployment

The project is designed to deploy to Vercel with zero configuration.

```bash
npm i -g vercel
vercel          # preview
vercel --prod   # production
```

Set `ANTHROPIC_API_KEY` and `ADMIN_PASSWORD` as environment variables in the Vercel dashboard under Project Settings → Environment Variables.

Do not set `NODE_TLS_REJECT_UNAUTHORIZED=0` in production.

---

## Security Practices

- Input validation on all API routes before any business logic runs.
- Security headers in `next.config.js`: `X-Content-Type-Options`, `X-Frame-Options`, `Strict-Transport-Security`, `Permissions-Policy`, `X-XSS-Protection`.
- Safe JSON parsing via `parseJsonBody` — malformed bodies return 400, not 500.
- Admin cookie is `httpOnly` and `sameSite: strict` — inaccessible to JavaScript and not sent on cross-site requests.
- Admin password is never stored — only the sha256 hash is compared at request time.
- UUIDs for all resource ids prevent enumeration.
- TypeScript strict mode throughout.

---

## Decisions and Trade-offs

**In-memory store with globalThis**
Module-level singletons reset on Next.js hot-module reloads in development. The store is attached to `globalThis` to survive reloads, matching the behavior of production where modules are stable.

**Email as registration identity**
Registrations use email as the unique identifier (`userId` field) rather than a freeform string. This makes dedup meaningful — the same person can't register twice for the same event — without requiring user accounts.

**Admin auth — single shared password**
A single `ADMIN_PASSWORD` with an httpOnly cookie is the simplest auth that provides real gating without a user database or auth library. It's appropriate for a single-admin demo; a production system would use a proper auth provider (NextAuth, Clerk, etc.).

**AI as UX layer, not business logic**
The AI routes pre-fill the form; they don't create events directly. All validation and business rules run on the actual form submission. This means a hallucinated date or capacity from the AI is caught before it reaches the store.

**Max capacity capped at 50**
Enforced in both the validator (server-side) and the form `max` attribute (client-side) to keep the in-memory store from growing unbounded in a demo context.

**Known limitation: race condition in the in-memory store**
The business rule checks (is the event full? has this email registered?) are read-then-write with no locking. Under concurrent requests, two users could both pass the capacity check and both be inserted. In production, fix this with a per-event async mutex, optimistic concurrency, or a database transaction.

---

## Future State

The current version is a functional demo built on in-memory storage and a single shared admin password. The vision for this app as a production-grade platform involves four areas of investment.

### Production infrastructure

The most important structural change is replacing the in-memory store with a real database. PostgreSQL is the natural fit — it gives transactional guarantees (fixing the race condition), persistent data across restarts, and a clear migration path. The service layer (`lib/events.ts`, `lib/registrations.ts`) is already fully decoupled from storage, so this is a single-file swap in `lib/store/index.ts`. Prisma or Drizzle ORM would sit between the service layer and the database.

### Authentication and multi-admin support

The single shared password is replaced by a proper auth provider. [Clerk](https://clerk.com) or [NextAuth.js](https://next-auth.js.org) would add per-user accounts, role-based access (admin vs. attendee), OAuth login (Google, GitHub), and session management — all without building it from scratch. Admins could be provisioned per-organisation, enabling multi-tenant support where each team manages its own events independently.

### Attendee experience

Several features would significantly improve the attendee side of the product. Email confirmations (via Resend or SendGrid) sent automatically on registration, with the registration ID embedded so unregistering is a single click. A personal dashboard where attendees can view and manage all their registrations. Waitlist support for full events, with automatic promotion when a spot opens. QR code check-in at the door, generated from the registration ID. Calendar export (`.ics`) so events land directly in attendees' calendars.

### Expanded AI capabilities

The current AI features (natural language creation, description generation) are a foundation. The next layer would be a conversational registration assistant — a chatbot embedded on the event page that answers questions, helps attendees decide whether an event fits them, and can complete registration through dialogue. Longer term, AI-powered scheduling suggestions (proposing the best time for a new event based on past attendance patterns) and automatic event description improvement as details change.

---

## CI/CD Pipeline

The project is designed to deploy to [Vercel](https://vercel.com) with a GitHub Actions CI pipeline that runs on every pull request and deploys automatically on merge.

### How it works

```
Pull request opened
       │
       ▼
GitHub Actions — CI workflow
  ├── npm ci
  ├── npm run lint
  ├── npm test
  ├── npm run build
  └── (all pass) → Vercel preview deploy
       │
       ▼
PR merged to main
       │
       ▼
Vercel — production deploy (automatic)
```

### Setting it up

**1. Connect the repo to Vercel**

Go to [vercel.com/new](https://vercel.com/new), import the GitHub repo, and add environment variables under Project Settings → Environment Variables:

```
ANTHROPIC_API_KEY=sk-ant-...
ADMIN_PASSWORD=your-production-password
```

Vercel will deploy automatically on every push to `main` once connected.

**2. Create the GitHub Actions workflow**

Create `.github/workflows/ci.yml`:

```yaml
name: CI

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v4

      - name: Set up Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Lint
        run: npm run lint

      - name: Test
        run: npm test

      - name: Build
        run: npm run build
        env:
          ANTHROPIC_API_KEY: ${{ secrets.ANTHROPIC_API_KEY }}
          ADMIN_PASSWORD: ${{ secrets.ADMIN_PASSWORD }}
```

**3. Add secrets to GitHub**

In your repo: Settings → Secrets and variables → Actions → New repository secret. Add `ANTHROPIC_API_KEY` and `ADMIN_PASSWORD` with your production values.

**4. Vercel preview deploys (optional)**

Install the [Vercel GitHub integration](https://vercel.com/docs/deployments/git) to get an automatic preview URL posted as a comment on every PR. Each PR gets its own isolated preview environment, making it easy to review changes before merging.
