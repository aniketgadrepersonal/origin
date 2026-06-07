# Components (`src/components/`)

Split into three directories: `ui/` for stateless primitives, `events/` for domain-specific components, and `admin/` for admin-only views.

---

## `ui/index.tsx`

All primitive UI components live in a single file to keep imports simple.

**`Button`** — variants: `primary`, `secondary`, `ghost`, `danger`. Sizes: `sm`, `md`, `lg`. Accepts `loading` prop that swaps the label for a `Spinner` and disables the button.

**`Badge`** — inline status chip. Variants: `default`, `blue`, `red`, `green`, `yellow`, `gray`.

**`Spinner`** — animated SVG ring used inside `Button` during loading states.

**`EmptyState`** — centered empty-page layout with title, optional subtitle, and optional action slot.

**`Toast`** — fixed bottom-right notification that auto-dismisses after 3.5 seconds. Variants: `success`, `error`.

**`Modal`** — accessible dialog overlay with full keyboard support. Closes on Escape or backdrop click. Includes `role="dialog"`, `aria-modal="true"`, `aria-labelledby` on the title, auto-focus on first focusable element on open, and a Tab/Shift+Tab focus trap.

---

## `events/EventCard.tsx`

Renders a single event as a card. Accepts an `isAdmin` boolean prop that controls which actions are visible.

Non-admin view: Register and Unregister buttons only.

Admin view: Edit and a "Registrations" link (in a separate row below the capacity bar to avoid layout crowding), plus the standard Register/Unregister buttons.

The capacity progress bar color shifts from blue → yellow at 80% → red at 100%. The Unregister button only appears when `registrationCount > 0` and the event is not past. Register is disabled when `isFull`.

---

## `events/EventForm.tsx`

Controlled form for creating and editing events. Operates in two modes (`create` / `edit`) — the `initial` prop pre-fills fields for editing.

In create mode, an "✦ Create with AI" panel appears at the top. Type a natural language description and click "Fill form" (or press Enter) to call `/api/ai/parse-event` and pre-fill all fields. The fields remain editable before submission.

The date input is calendar-picker only — keyboard entry is blocked via `onKeyDown` and clicking anywhere on the field calls `showPicker()`. This prevents malformed dates.

The "✦ Generate" button next to the description field calls `/api/ai/generate-description` with the current title. Disabled until a title is entered.

Max capacity is capped at 50 via `max={50}` on the input and the label reads "Max capacity (max 50)".

---

## `events/RegisterPanel.tsx`

Handles both register and unregister flows in a shared modal panel.

In `register` mode: collects Name (required), Email (required), and About me (optional). Email is used as the dedup key server-side. On success, transitions to a confirmation screen showing the registration ID in a copyable monospace box — the user must click Done to dismiss so the ID is never silently discarded.

In `unregister` mode: collects a registration ID (the one shown at registration time) and calls `DELETE /api/registrations/:id`.

Both modes display inline API errors without closing the modal.

---

## `admin/RegistrationsModal.tsx`

Admin-only view of all registrations for a single event. Fetches from `GET /api/admin/events/:id/registrations` on mount. Renders a table with columns: Name, Email, About me, Registered date. Shows a spinner while loading, an inline error on failure, and an empty-state message if no one has registered yet.
