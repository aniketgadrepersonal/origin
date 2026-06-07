# Library Layer (`src/lib/`)

The lib directory contains everything that is not tied to HTTP or React: the data store, domain services, input validators, AI client, admin auth, and API utilities. All of it is pure TypeScript and can be tested without a running server or browser.

---

## `store/index.ts`

The in-memory data store. Holds two `Map` instances — one for events, one for registrations — attached to `globalThis` so the singleton survives Next.js hot-module reloads in development without resetting between requests.

Exports:
- `default store` — the singleton, imported by the service layer.
- `resetStore()` — clears both maps. For use in tests only; never call in production code.

The store is deliberately a dumb container with no logic. Swapping it for a real database means changing only this file.

---

## `events.ts`

The events service. Contains all read and write logic for the `Event` domain.

- `getAllEvents()` — returns all events sorted by date ascending, each enriched with live availability data.
- `getEventById(id)` — returns a single enriched event or `null`.
- `createEvent(input)` — generates a UUID, stamps `createdAt`/`updatedAt`, persists to the store, and returns the enriched event.
- `updateEvent(id, input)` — applies a partial patch. Before writing, checks that `maxCapacity` (if provided) would not fall below the current registration count. Returns `{ event, error? }` so the route handler can distinguish a 404 from a 409.

The private `enrichEvent` helper computes `registrationCount`, `availableSpots`, and `isFull` on every read so the store never holds derived state. `getRegistrationCountForEvent` is kept here rather than imported from `registrations.ts` to avoid a circular dependency.

---

## `registrations.ts`

The registrations service. Enforces all three business rules before any write.

- `registerForEvent(input)` — checks rules in order: event exists (404), event is in the future (409), capacity not exceeded (409), email not already registered for this event (409). On success, creates a registration with `name`, `email`, `aboutMe`, and sets `userId` to the normalised email. Returns `{ success: true, registration }` or `{ success: false, error, statusCode }`.
- `unregisterFromEvent(id)` — deletes a registration by id. Returns `true` on success, `false` if not found.
- `getRegistrationsByEvent(eventId)` — returns all registrations for an event, used by the admin route.
- `getRegistrationsByUser(userId)` — returns all registrations for a given userId (email).

---

## `validators/index.ts`

Pure input validation — no side effects, no store access. Each function returns a `ValidationError[]`; an empty array means the input is valid.

- `validateCreateEvent` — all four fields required; title ≤ 200 chars; date must be a valid ISO string in the future; `maxCapacity` must be a positive integer ≤ 50.
- `validateUpdateEvent` — all fields optional, but any provided field is validated with the same rules.
- `validateCreateRegistration` — `eventId` required; `name` required; `email` required and must match a basic email format (`x@x.x`).

---

## `admin-auth.ts`

Admin authentication helper. Uses a sha256 hash of `ADMIN_PASSWORD` as the cookie value — good enough for a single-admin demo environment.

- `getAdminToken()` — returns `sha256(ADMIN_PASSWORD)`.
- `isAdminRequest()` — reads the `admin_token` cookie via `next/headers` and returns true if it matches the expected token.
- `adminCookieOptions(maxAge)` — returns a cookie config object ready to pass to `res.cookies.set()`.

---

## `ai.ts`

Shared Anthropic client. Sets `NODE_TLS_REJECT_UNAUTHORIZED=0` in non-production environments before importing the SDK — this handles corporate SSL inspection proxies that re-sign HTTPS traffic with a local CA that Node.js wouldn't otherwise trust.

Exports `anthropic` — a pre-configured `Anthropic` instance. Import this instead of constructing `new Anthropic()` directly in route handlers.

---

## `utils/api.ts`

Shared response construction utilities imported by every route handler.

- `successResponse(data, message?, status?)` — wraps data in the `ApiResponse` envelope. Default status 200.
- `errorResponse(error, status?)` — envelope with `success: false`. Default status 400.
- `validationErrorResponse(errors)` — formats a `ValidationError[]` into a pipe-delimited message and returns 422.
- `parseJsonBody<T>(req)` — safely parses the request body. Returns `null` on empty or malformed JSON so route handlers return 400 instead of crashing.
