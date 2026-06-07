# API Routes

All routes live under `src/app/api/` and follow the Next.js App Router convention. Every handler is a thin layer: parse the request, validate input, delegate to the service layer, and return a typed `ApiResponse<T>` envelope.

Response shape used by every endpoint:

```json
{ "success": true|false, "data": {...}, "error": "...", "message": "..." }
```

---

## `events/route.ts`

**`GET /api/events`** — calls `getAllEvents()` and returns the full list sorted by date ascending. Each event includes computed `registrationCount`, `availableSpots`, and `isFull` fields.

**`POST /api/events`** — parses the body, runs `validateCreateEvent`, then calls `createEvent`. Returns 201 on success, 422 on validation failure, 400 on malformed JSON.

---

## `events/[id]/route.ts`

**`GET /api/events/:id`** — calls `getEventById`. Returns 200 with the event or 404 if not found.

**`PATCH /api/events/:id`** — parses and validates the body (all fields optional), then calls `updateEvent`. Returns 200 on success, 404 if the event doesn't exist, 409 if the new `maxCapacity` would be lower than the current registration count, 422 on validation errors.

---

## `registrations/route.ts`

**`POST /api/registrations`** — validates that `eventId` and `userId` are present, then calls `registerForEvent`. The service layer enforces all three business rules and returns a typed result that maps directly to the appropriate HTTP status (404 for unknown event, 409 for rule violations, 201 on success).

---

## `registrations/[id]/route.ts`

**`DELETE /api/registrations/:id`** — calls `unregisterFromEvent(params.id)`. Returns 200 on success, 404 if the registration does not exist.

---

## Shared utilities

Route handlers import from `@/lib/utils/api` for response construction (`successResponse`, `errorResponse`, `validationErrorResponse`) and safe JSON parsing (`parseJsonBody`). See [`src/lib/README.md`](../../lib/README.md).
