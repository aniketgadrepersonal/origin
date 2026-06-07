/**
 * Events service — all business logic for creating, reading, and updating events.
 *
 * This layer is intentionally decoupled from Next.js request/response objects
 * so it can be tested in isolation without spinning up an HTTP server.
 */

import { v4 as uuidv4 } from "uuid";
import store from "@/lib/store";
import type {
  Event,
  EventResponse,
  CreateEventInput,
  UpdateEventInput,
} from "@/types";

// ---------------------------------------------------------------------------
// Read
// ---------------------------------------------------------------------------

/**
 * Returns all events sorted by date ascending, each enriched with
 * real-time availability data derived from the registration store.
 */
export function getAllEvents(): EventResponse[] {
  const events = Array.from(store.events.values()).sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );
  return events.map(enrichEvent);
}

/**
 * Returns a single event by id, or null if not found.
 */
export function getEventById(id: string): EventResponse | null {
  const event = store.events.get(id);
  if (!event) return null;
  return enrichEvent(event);
}

// ---------------------------------------------------------------------------
// Write
// ---------------------------------------------------------------------------

/**
 * Creates a new event and persists it to the in-memory store.
 */
export function createEvent(input: CreateEventInput): EventResponse {
  const now = new Date().toISOString();
  const event: Event = {
    id: uuidv4(),
    title: input.title.trim(),
    description: input.description.trim(),
    date: input.date,
    maxCapacity: input.maxCapacity,
    createdAt: now,
    updatedAt: now,
  };

  store.events.set(event.id, event);
  return enrichEvent(event);
}

/**
 * Partially updates an existing event.
 * Returns the updated event, or null if no event with that id exists.
 *
 * Business rule: if maxCapacity is being reduced, it must not fall below the
 * current registration count to avoid overselling.
 */
export function updateEvent(
  id: string,
  input: UpdateEventInput
): { event: EventResponse | null; error?: string } {
  const existing = store.events.get(id);
  if (!existing) return { event: null };

  // Guard: new capacity cannot be less than current registrations
  if (input.maxCapacity !== undefined) {
    const registrationCount = getRegistrationCountForEvent(id);
    if (input.maxCapacity < registrationCount) {
      return {
        event: null,
        error: `Cannot reduce capacity below current registration count (${registrationCount}).`,
      };
    }
  }

  const updated: Event = {
    ...existing,
    ...(input.title !== undefined && { title: input.title.trim() }),
    ...(input.description !== undefined && {
      description: input.description.trim(),
    }),
    ...(input.date !== undefined && { date: input.date }),
    ...(input.maxCapacity !== undefined && { maxCapacity: input.maxCapacity }),
    updatedAt: new Date().toISOString(),
  };

  store.events.set(id, updated);
  return { event: enrichEvent(updated) };
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Derives the current registration count for an event from the registration store.
 * Kept here rather than importing from registrations service to avoid circular deps.
 */
function getRegistrationCountForEvent(eventId: string): number {
  return Array.from(store.registrations.values()).filter(
    (r) => r.eventId === eventId
  ).length;
}

/**
 * Attaches computed availability fields to a raw Event record.
 */
function enrichEvent(event: Event): EventResponse {
  const registrationCount = getRegistrationCountForEvent(event.id);
  const availableSpots = Math.max(0, event.maxCapacity - registrationCount);
  return {
    ...event,
    registrationCount,
    availableSpots,
    isFull: availableSpots === 0,
  };
}
