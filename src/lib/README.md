# Library Layer (`src/lib/`)

The lib directory contains everything that is not tied to HTTP or React: the data store, domain services, input validators, and API utilities. All of it is pure TypeScript and can be tested without a running server or browser.

---

## `store/index.ts`

The in-memory data store. Holds two `Map` instances — one for events, one for registrations — as a module-level singleton so all route handlers in the same Node.js process share the same state.

Exports:
- `default store` — the singleton, imported by the service layer.
- `resetStore()` — clears both maps. Intended for use in tests only; never call this in production code.

The store is deliberately kept as a dumb container with no logic. Swapping it for a real database means changing only this file.

---

## `events.ts`

The events service. Contains all read and write logic for the `Event` domain. Route handlers call these functions directly.

- `getAllEvents()` — returns all events sorted by date ascending, each enriched with live availability data (see `enrichEvent` below).
- `getEventById(id)` — returns a single enriched event or `null`.
- `createEvent(input)` — generates a UUID, stamps `createdAt`/`updatedAt`, persists to the store, and returns the enriched event.
- `updateEvent(id, input)` — applies a partial patch. Before writing, checks that `maxCapacity` (if provided) would not fall below the current registration count. Returns `{ event, error? }` so the route handler can distinguish a 404 from a 409 without catching exceptions.

The private `enrichEvent` helper computes `registrationCount`, `availableSpots`, and `isFull` on every read so the store never holds derived state. `getRegistrationCountForEvent` is duplicated here (rather than imported from `registrations.ts`) to avoid a circular dependency.

---

## `registrations.ts`

The registrations service. Enforces all three business rules before any write.

- `registerForEvent(input)` — checks rules in order: event exists (404), event is in the future (409), capacity not exceeded (409), user not already registered (409). On success, creates a registration and returns `{ success: true, registration }`. On any failure, returns `{ success: false, error, statusCode }` so the route handler can forward the status code directly.
- `unregisterFromEvent(id)` — deletes a registration by id. Returns `true` on success, `false` if not found.
- `getRegistrationsByEvent(eventId)` / `getRegistrationsByUser(userId)` — read helpers, currently unused by route handlers but available for future endpoints or analytics.

---

## `validators/index.ts`

Pure input validation — no side effects, no store access. Each function accepts a partial input object and returns a `ValidationError[]`. An empty array means the input is valid.

- `validateCreateEvent` — all four fields required; title ≤ 200 chars; date must be a valid ISO string in the future.
- `validateUpdateEvent` — all fields optional, but any provided field is validated with the same rules.
- `validateCreateRegistration` — both `eventId` and `userId` must be non-empty strings.

Keeping validators separate from the service layer means they can be unit tested independently and reused if client-side validation is added later.

---

## `utils/api.ts`

Shared response construction utilities imported by every route handler.

- `successResponse(data, message?, status?)` — wraps data in the `ApiResponse` envelope and calls `NextResponse.json`. Default status is 200.
- `errorResponse(error, status?)` — same envelope with `success: false`. Default status is 400.
- `validationErrorResponse(errors)` — formats a `ValidationError[]` into a pipe-delimited message and returns 422.
- `parseJsonBody<T>(req)` — reads the request body as text and parses it. Returns `null` (instead of throwing) if the body is empty or not valid JSON, so route handlers return a clean 400 rather than a 500.
