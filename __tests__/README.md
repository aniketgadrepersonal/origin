# Tests (`__tests__/`)

Tests are split into two layers: unit tests for the pure service/validator logic, and integration tests for the API route handlers.

Run all tests:

```bash
npm test
```

---

## `lib/` — Unit tests

Test the service layer and validators in isolation. No HTTP, no server, no React. The store is reset between tests using `resetStore()`.

**`events.test.ts`** — covers `createEvent`, `getAllEvents`, `getEventById`, `updateEvent`. Key cases: events are returned sorted by date; `enrichEvent` computes availability correctly; `updateEvent` rejects capacity reductions below the current registration count.

**`registrations.test.ts`** — covers all three business rules enforced by `registerForEvent`: past-event rejection, capacity enforcement, and double-register prevention. Also covers `unregisterFromEvent` and `getRegistrationsByEvent`.

**`validators.test.ts`** — covers `validateCreateEvent`, `validateUpdateEvent`, and `validateCreateRegistration`. Tests valid inputs return empty arrays and invalid inputs return the correct field-level errors.

---

## `api/` — Integration tests

Test the full route handler stack using `next-test-api-route-handler`, which wraps App Router handlers directly without spinning up an HTTP server. These tests verify that request parsing, validation, service logic, and response serialisation are correctly wired together end-to-end.

**`events.test.ts`** — covers:
- `GET /api/events` returns an empty list, then a populated list after creation.
- `POST /api/events` returns 201 with the correct shape; 422 on missing fields; 422 on a past date; 400 on malformed JSON.
- `GET /api/events/:id` returns the event; 404 for an unknown id.
- `PATCH /api/events/:id` applies a partial update; 404 for an unknown id.

**`registrations.test.ts`** — covers:
- `POST /api/registrations` happy path returns 201 with a registration id.
- Capacity enforcement: the third registration on a capacity-2 event returns 409 with an error matching `/capacity/i`.
- Double-register prevention: same user, same event returns 409 matching `/already registered/i`.
- Same user can register for two different events.
- `DELETE /api/registrations/:id` returns 200; 404 on a second delete; re-registration succeeds after unregistering.
- Validation: 422 when `eventId` or `userId` is missing.

---

## Design notes

The unit and integration test layers complement each other rather than duplicate. Unit tests run fast and cover edge cases in isolation. Integration tests prove the route wiring — that the right validator is called, that the service result maps to the right HTTP status, and that the response envelope is correctly formed. Neither layer alone gives full confidence; together they do.
