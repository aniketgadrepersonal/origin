# API Routes

All routes live under `src/app/api/` and follow the Next.js App Router convention. Every handler is a thin layer: parse the request, validate input, delegate to the service layer, and return a typed `ApiResponse<T>` envelope.

Response shape used by every endpoint:

```json
{ "success": true|false, "data": {...}, "error": "...", "message": "..." }
```

---

## `events/route.ts`

**`GET /api/events`** — calls `getAllEvents()` and returns the full list sorted by date ascending. Each event includes computed `registrationCount`, `availableSpots`, and `isFull` fields.

**`POST /api/events`** — parses the body, runs `validateCreateEvent`, then calls `createEvent`. Returns 201 on success, 422 on validation failure, 400 on malformed JSON. Intended for admin use only (enforced in the UI; no server-side auth check on this route).

---

## `events/[id]/route.ts`

**`GET /api/events/:id`** — calls `getEventById`. Returns 200 with the event or 404 if not found.

**`PATCH /api/events/:id`** — parses and validates the body (all fields optional), then calls `updateEvent`. Returns 200 on success, 404 if the event doesn't exist, 409 if the new `maxCapacity` would be lower than the current registration count or exceed 50, 422 on validation errors.

---

## `registrations/route.ts`

**`POST /api/registrations`** — validates `eventId`, `name`, and `email` (with format check), then calls `registerForEvent`. The service layer enforces all three business rules and returns a typed result that maps directly to the appropriate HTTP status (404 for unknown event, 409 for rule violations, 201 on success).

Request body:
```json
{ "eventId": "uuid", "name": "Jane Smith", "email": "jane@example.com", "aboutMe": "optional" }
```

Email is normalised to lowercase and used as the `userId` for dedup purposes.

---

## `registrations/[id]/route.ts`

**`DELETE /api/registrations/:id`** — calls `unregisterFromEvent(params.id)`. Returns 200 on success, 404 if the registration does not exist.

---

## `ai/parse-event/route.ts`

**`POST /api/ai/parse-event`** — accepts a natural language `prompt` string and returns structured event fields (`title`, `description`, `date`, `maxCapacity`) by calling Claude Haiku. All dates are resolved in Central Time. Returns 400 if prompt is missing, 500 if `ANTHROPIC_API_KEY` is not set or the AI call fails.

---

## `ai/generate-description/route.ts`

**`POST /api/ai/generate-description`** — accepts an event `title` and returns a 1–2 sentence professional description by calling Claude Haiku. Returns 400 if title is missing, 500 on AI failure.

---

## `admin/login/route.ts`

**`POST /api/admin/login`** — accepts `{ password }`, compares its sha256 hash against the hash of `ADMIN_PASSWORD`, and sets an httpOnly `admin_token` cookie (8-hour expiry) on success. Returns 401 on wrong password.

---

## `admin/logout/route.ts`

**`POST /api/admin/logout`** — clears the `admin_token` cookie by setting `maxAge: 0`.

---

## `admin/me/route.ts`

**`GET /api/admin/me`** — reads the `admin_token` cookie and returns `{ isAdmin: true | false }`. Called on page mount to restore admin state across refreshes.

---

## `admin/events/[id]/registrations/route.ts`

**`GET /api/admin/events/:id/registrations`** — returns the full registration list for an event including `name`, `email`, and `aboutMe`. Requires a valid `admin_token` cookie; returns 401 otherwise.

---

## Shared utilities

Route handlers import from `@/lib/utils/api` for response construction (`successResponse`, `errorResponse`, `validationErrorResponse`) and safe JSON parsing (`parseJsonBody`). See [`src/lib/README.md`](../../lib/README.md).
