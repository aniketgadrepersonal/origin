# Components (`src/components/`)

Split into two directories: `ui/` for stateless primitives shared across the app, and `events/` for domain-specific components.

---

## `ui/index.tsx`

All primitive UI components live in a single file to keep imports simple.

**`Button`** — supports four variants (`primary`, `secondary`, `ghost`, `danger`) and three sizes (`sm`, `md`, `lg`). Accepts a `loading` prop that swaps the label for a `Spinner` and disables the button, preventing double-submission.

**`Badge`** — inline status chip. Variants: `default`, `blue`, `red`, `green`, `yellow`, `gray`. Used for event status (Open, Full, Past) and registration confirmation.

**`Spinner`** — an animated SVG ring. Used inside `Button` during loading states.

**`EmptyState`** — centered empty-page layout with a title, optional subtitle, and optional action slot. Shown when the events list is empty or a search returns no results.

**`Toast`** — fixed bottom-right notification that auto-dismisses after 3.5 seconds. Accepts `success` or `error` type. Used after create, update, register, and unregister operations.

**`Modal`** — accessible dialog overlay. Closes on Escape key or backdrop click. Includes:
- `role="dialog"` and `aria-modal="true"` on the panel.
- `aria-labelledby` pointing to the title element so screen readers announce the dialog name on open.
- Auto-focus on the first focusable element when the modal opens.
- Tab/Shift+Tab focus trap that cycles through focusable elements within the panel and never lets focus escape to the page behind it.
- `aria-label="Close dialog"` on the close button.

---

## `events/EventCard.tsx`

Renders a single event as a card. Shows the title, description (truncated), date/time, a capacity progress bar, and a status badge. The bar color shifts from blue to yellow at 80% capacity and red at 100%.

Manages three modal states internally: edit, register, and unregister. The unregister button only appears when `registrationCount > 0` and the event is not past. The register button is disabled when `isFull`.

Delegates all data mutations to the `onUpdate` prop (from `useEvents`) and calls `onRefresh` after a registration or unregistration so the parent re-fetches the latest availability.

---

## `events/EventForm.tsx`

Controlled form for creating and editing events. Works in two modes (`create` / `edit`) — the `initial` prop pre-populates fields when editing.

Converts the stored UTC ISO date to a `datetime-local` string for the browser input (`toLocalDatetime`), and converts it back to ISO on submit. This means the user sees local time while the API stores UTC.

The `onSubmit` prop receives the validated form data and returns `{ success, error? }`. If unsuccessful, the form displays the error inline without closing the modal.

---

## `events/RegisterPanel.tsx`

Handles both the register and unregister flows inside a shared modal panel.

In `register` mode: collects a user ID, calls `useRegistrations().register()`, then transitions to a confirmation screen showing the registration ID in a copyable monospace box. The user must click Done to dismiss — the ID is never silently discarded. This is the fix for the original UX gap where the ID was lost immediately after registration.

In `unregister` mode: collects a registration ID and calls `useRegistrations().unregister()`. On success the modal closes immediately (no intermediate state needed).

Both modes show inline errors from the API (capacity exceeded, double-register, etc.) without closing the modal.
