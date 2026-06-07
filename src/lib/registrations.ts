/**
 * Registrations service — all business logic for registering and unregistering
 * attendees from events.
 *
 * All three business rules from the spec are enforced here:
 *   1. Cannot register for a past event.
 *   2. Cannot exceed event capacity.
 *   3. Cannot double-register the same user for the same event.
 */

import { v4 as uuidv4 } from "uuid";
import store from "@/lib/store";
import type { Registration, CreateRegistrationInput } from "@/types";

// ---------------------------------------------------------------------------
// Read
// ---------------------------------------------------------------------------

/**
 * Returns all registrations for a given event, sorted by registration date.
 */
export function getRegistrationsByEvent(eventId: string): Registration[] {
  return Array.from(store.registrations.values())
    .filter((r) => r.eventId === eventId)
    .sort(
      (a, b) =>
        new Date(a.registeredAt).getTime() - new Date(b.registeredAt).getTime()
    );
}

/**
 * Returns all registrations for a given user.
 */
export function getRegistrationsByUser(userId: string): Registration[] {
  return Array.from(store.registrations.values()).filter(
    (r) => r.userId === userId
  );
}

// ---------------------------------------------------------------------------
// Write
// ---------------------------------------------------------------------------

export type RegistrationResult =
  | { success: true; registration: Registration }
  | { success: false; error: string; statusCode: number };

/**
 * Registers a user for an event, enforcing all business rules.
 */
export function registerForEvent(
  input: CreateRegistrationInput
): RegistrationResult {
  const event = store.events.get(input.eventId);

  // Rule 0: event must exist
  if (!event) {
    return { success: false, error: "Event not found.", statusCode: 404 };
  }

  // Rule 1: cannot register for a past event
  if (new Date(event.date).getTime() <= Date.now()) {
    return {
      success: false,
      error: "Cannot register for an event that has already passed.",
      statusCode: 409,
    };
  }

  // Rule 2: cannot exceed capacity
  const currentCount = getRegistrationCountForEvent(input.eventId);
  if (currentCount >= event.maxCapacity) {
    return {
      success: false,
      error: "This event has reached maximum capacity.",
      statusCode: 409,
    };
  }

  // Rule 3: cannot double-register (keyed on email)
  const emailKey = input.email.toLowerCase().trim();
  const alreadyRegistered = Array.from(store.registrations.values()).some(
    (r) => r.eventId === input.eventId && r.userId === emailKey
  );
  if (alreadyRegistered) {
    return {
      success: false,
      error: "This email is already registered for the event.",
      statusCode: 409,
    };
  }

  const registration: Registration = {
    id: uuidv4(),
    eventId: input.eventId,
    userId: emailKey,
    name: input.name.trim(),
    email: emailKey,
    aboutMe: input.aboutMe?.trim() ?? "",
    registeredAt: new Date().toISOString(),
  };

  store.registrations.set(registration.id, registration);
  return { success: true, registration };
}

/**
 * Removes a registration by its id.
 * Returns false if the registration does not exist.
 */
export function unregisterFromEvent(registrationId: string): boolean {
  return store.registrations.delete(registrationId);
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getRegistrationCountForEvent(eventId: string): number {
  return Array.from(store.registrations.values()).filter(
    (r) => r.eventId === eventId
  ).length;
}
