/**
 * In-memory data store.
 *
 * Design decisions:
 * - A single module-level singleton is used so all API routes in the same
 *   Next.js server process share the same state (important for Next.js route
 *   handlers which are module-cached).
 * - Maps are used instead of plain objects for O(1) lookups by id.
 * - Data resets on every server restart, as required by the spec.
 *
 * If a persistent store is ever needed, only this file needs to change —
 * all business logic in lib/events.ts and lib/registrations.ts is store-agnostic.
 */

import type { Event, Registration } from "@/types";

interface Store {
  events: Map<string, Event>;
  registrations: Map<string, Registration>;
}

// Attach to globalThis so the store survives Next.js hot-module reloads in
// development. In production, module-level state is stable and this is a no-op.
const g = globalThis as typeof globalThis & { __eventStore?: Store };

if (!g.__eventStore) {
  g.__eventStore = {
    events: new Map<string, Event>(),
    registrations: new Map<string, Registration>(),
  };
}

const store: Store = g.__eventStore;

export default store;

/**
 * Clears all data from the store.
 * Intended for use in tests only — do not call in production code.
 */
export function resetStore(): void {
  store.events.clear();
  store.registrations.clear();
}
