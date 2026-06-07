# Tests (`__tests__/`)

Tests are split into two layers: unit tests for the pure service/validator logic, and integration tests for the API route handlers.

```bash
npm test              # all tests
npm run test:watch    # watch mode
npm run test:coverage # coverage report
```

---

## `lib/` — Unit tests

Test the service layer and validators in isolation. No HTTP, no server, no React. `resetStore()` is called in `beforeEach` to ensure each test starts with a clean slate.

**`events.test.ts`** — covers `createEvent`, `getAllEvents`, `getEventById`, `updateEvent`. Key cases: events sorted by date; `enrichEvent` computes availability correctly; `updateEvent` rejects capacity reductions below current registration count.

**`registrations.test.ts`** — covers all three business rules enforced by `registerForEvent`: past-event rejection, capacity enforcement, and double-register prevention (keyed on email). Also covers `unregisterFromEvent` and `getRegistrationsByEvent`.

**`validators.test.ts`** — covers `validateCreateEvent`, `validateUpdateEvent`, and `validateCreateRegistration`. Tests that valid inputs return empty arrays and that invalid inputs return the correct field-level errors, including the new name/email validations and the maxCapacity ≤ 50 rule.

---

## `api/` — Integration tests

Test the full route handler stack using `next-test-api-route-handler`, which wraps App Router handlers directly without spinning up an HTTP server. These tests verify that request parsing, validation, service logic, and response serialisation are correctly wired together end-to-end.

**`events.test.ts`** — covers:
- `GET /api/events` returns empty list, then populated list after creation.
- `POST /api/events` returns 201 with the correct shape; 422 on missing fields; 422 on a past date; 400 on malformed JSON.
- `GET /api/events/:id` returns the event; 404 for unknown id.
- `PATCH /api/events/:id` applies a partial update; 404 for unknown id.

**`registrations.test.ts`** — covers:
- `POST /api/registrations` happy path returns 201 with a registration id containing name, email, aboutMe.
- Capacity enforcement: third registration on a capacity-2 event returns 409 matching `/capacity/i`.
- Double-register prevention: same email, same event returns 409 matching `/already registered/i`.
- Same email can register for two different events.
- `DELETE /api/registrations/:id` returns 200; 404 on second delete; re-registration succeeds after unregistering.
- Validation: 422 when `eventId`, `name`, or `email` is missing.

---

## Design notes

Unit tests and integration tests complement rather than duplicate each other. Unit tests run fast and cover edge cases in the business logic. Integration tests prove the route wiring — that the right validator is called, that service results map to the right HTTP status codes, and that the response envelope is correctly formed. Neither layer alone gives full confidence; together they do.

The `resetStore()` helper exported from `src/lib/store/index.ts` is the test-only escape hatch that lets both layers run in-process without test isolation issues.
