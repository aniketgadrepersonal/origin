# Hooks (`src/hooks/`)

Custom React hooks that own all data-fetching and mutation logic. Components stay presentation-only; all `fetch` calls live here.

---

## `useEvents.ts`

Fetches and manages the full event list for the main page.

State: `events` (the list), `loading`, and `error`.

On mount, `fetchEvents` is called automatically via `useEffect`. The same function is exposed as `refresh` so components can trigger a re-fetch after a registration or unregistration changes availability counts.

Mutations:
- `createEvent(input)` — POSTs to `/api/events`, then calls `fetchEvents` to sync the list. Returns `{ success, error? }`.
- `updateEvent(id, input)` — PATCHes `/api/events/:id`, then re-fetches. Returns `{ success, error? }`.

Both mutations propagate the `message` field from the API envelope as the error string when available, falling back to `error`. This lets server-side validation messages reach the form's inline error display.

---

## `useRegistrations.ts`

Handles registration and unregistration mutations. Has no state of its own — it is called inside `RegisterPanel` which manages loading and error state locally.

- `register(eventId, userId)` — POSTs to `/api/registrations`. On success, returns `{ success: true, registrationId }` where `registrationId` is pulled from `json.data?.id`. The ID is surfaced to the user in the `RegisterPanel` confirmation screen.
- `unregister(registrationId)` — DELETEs `/api/registrations/:id`. Returns `{ success, error? }`.

The optional `onSuccess` callback (passed to the hook constructor) is called after a successful operation. `RegisterPanel` does not use this callback — it reads `registrationId` from the return value directly and manages its own post-success flow.

---

## `src/types/index.ts`

Shared TypeScript types used by both the frontend and the API layer. Keeping types in one file ensures the request/response contract stays in sync without duplication.

Key types:
- `Event` — the raw stored shape (id, title, description, date, maxCapacity, timestamps).
- `EventResponse` — `Event` plus computed fields added by `enrichEvent`: `registrationCount`, `availableSpots`, `isFull`. This is what the API returns and what the frontend renders.
- `Registration` — a single attendee record: id, eventId, userId, registeredAt.
- `CreateEventInput` / `UpdateEventInput` / `CreateRegistrationInput` — typed request body shapes.
- `ApiResponse<T>` — the universal response envelope: `{ success, data?, error?, message? }`.
- `ValidationError` — `{ field, message }`, used to return field-level feedback from validators.
