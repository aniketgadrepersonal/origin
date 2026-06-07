# Hooks (`src/hooks/`)

Custom React hooks that own all data-fetching and mutation logic. Components stay presentation-only; all `fetch` calls live here.

---

## `useEvents.ts`

Fetches and manages the full event list for the main page.

State: `events` (the list), `loading`, `error`.

On mount, `fetchEvents` fires automatically via `useEffect`. The same function is exposed as `refresh` so components can trigger a re-fetch after a registration or unregistration changes availability.

Mutations:
- `createEvent(input)` — POSTs to `/api/events`, then re-fetches. Returns `{ success, error? }`.
- `updateEvent(id, input)` — PATCHes `/api/events/:id`, then re-fetches. Returns `{ success, error? }`.

Both mutations propagate the `message` field from the API envelope as the error string when present, letting server-side validation messages surface in the form's inline error display.

---

## `useRegistrations.ts`

Handles registration and unregistration mutations. Has no state of its own — `RegisterPanel` manages loading and error state locally.

- `register(eventId, name, email, aboutMe?)` — POSTs to `/api/registrations` with all attendee fields. On success, returns `{ success: true, registrationId }` where `registrationId` is pulled from `json.data?.id`. The caller (`RegisterPanel`) surfaces this ID to the user in the confirmation screen.
- `unregister(registrationId)` — DELETEs `/api/registrations/:id`. Returns `{ success, error? }`.

The optional `onSuccess` callback passed to the hook constructor fires after a successful operation. `RegisterPanel` does not use it — it handles post-success flow directly from the return value.

---

## `src/types/index.ts`

Shared TypeScript types used by both the frontend and the API layer.

- `Event` — the raw stored shape: id, title, description, date (UTC ISO 8601), maxCapacity, timestamps.
- `EventResponse` — `Event` plus computed fields: `registrationCount`, `availableSpots`, `isFull`.
- `Registration` — a single attendee record: id, eventId, userId (normalised email), name, email, aboutMe, registeredAt.
- `CreateEventInput` — fields required to create an event.
- `UpdateEventInput` — all fields optional for partial patch.
- `CreateRegistrationInput` — eventId, name, email, aboutMe (optional).
- `ApiResponse<T>` — universal response envelope: `{ success, data?, error?, message? }`.
- `ValidationError` — `{ field, message }` for field-level feedback from validators.
