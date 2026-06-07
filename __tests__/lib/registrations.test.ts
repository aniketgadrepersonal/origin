/**
 * Unit tests for the registrations service.
 *
 * Focuses on the three core business rules:
 *   1. Cannot register for a past event.
 *   2. Cannot exceed capacity.
 *   3. Cannot double-register.
 */

import {
  registerForEvent,
  unregisterFromEvent,
  getRegistrationsByEvent,
} from "@/lib/registrations";
import { createEvent } from "@/lib/events";
import store from "@/lib/store";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function resetStore() {
  store.events.clear();
  store.registrations.clear();
}

function futureDate(daysAhead = 7): string {
  const d = new Date();
  d.setDate(d.getDate() + daysAhead);
  return d.toISOString();
}

function pastDate(): string {
  const d = new Date();
  d.setFullYear(d.getFullYear() - 1);
  return d.toISOString();
}

function makeFutureEvent(maxCapacity = 10) {
  return createEvent({
    title: "Future Event",
    description: "desc",
    date: futureDate(),
    maxCapacity,
  });
}

/** Directly inserts a past event into the store to bypass createEvent validation */
function insertPastEvent() {
  const event = {
    id: "past-event-id",
    title: "Past Event",
    description: "desc",
    date: pastDate(),
    maxCapacity: 10,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  store.events.set(event.id, event);
  return event;
}

// ---------------------------------------------------------------------------
// registerForEvent
// ---------------------------------------------------------------------------

describe("registerForEvent", () => {
  beforeEach(resetStore);

  it("successfully registers a user for a future event", () => {
    const event = makeFutureEvent();
    const result = registerForEvent({ eventId: event.id, userId: "user-1" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.registration.eventId).toBe(event.id);
      expect(result.registration.userId).toBe("user-1");
    }
  });

  it("persists the registration to the store", () => {
    const event = makeFutureEvent();
    registerForEvent({ eventId: event.id, userId: "user-1" });
    expect(store.registrations.size).toBe(1);
  });

  // Rule 0: event must exist
  it("returns 404 when the event does not exist", () => {
    const result = registerForEvent({ eventId: "ghost", userId: "user-1" });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.statusCode).toBe(404);
    }
  });

  // Rule 1: past event
  it("returns 409 when attempting to register for a past event", () => {
    const pastEvent = insertPastEvent();
    const result = registerForEvent({
      eventId: pastEvent.id,
      userId: "user-1",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.statusCode).toBe(409);
      expect(result.error).toMatch(/passed/i);
    }
  });

  // Rule 2: capacity
  it("returns 409 when the event is at full capacity", () => {
    const event = makeFutureEvent(2);
    registerForEvent({ eventId: event.id, userId: "user-1" });
    registerForEvent({ eventId: event.id, userId: "user-2" });
    const result = registerForEvent({ eventId: event.id, userId: "user-3" });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.statusCode).toBe(409);
      expect(result.error).toMatch(/capacity/i);
    }
  });

  // Rule 3: double registration
  it("returns 409 when the same user tries to register twice", () => {
    const event = makeFutureEvent();
    registerForEvent({ eventId: event.id, userId: "user-1" });
    const result = registerForEvent({ eventId: event.id, userId: "user-1" });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.statusCode).toBe(409);
      expect(result.error).toMatch(/already registered/i);
    }
  });

  it("allows different users to register for the same event", () => {
    const event = makeFutureEvent(5);
    const r1 = registerForEvent({ eventId: event.id, userId: "user-1" });
    const r2 = registerForEvent({ eventId: event.id, userId: "user-2" });
    expect(r1.success).toBe(true);
    expect(r2.success).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// unregisterFromEvent
// ---------------------------------------------------------------------------

describe("unregisterFromEvent", () => {
  beforeEach(resetStore);

  it("returns false when the registration does not exist", () => {
    expect(unregisterFromEvent("ghost-id")).toBe(false);
  });

  it("removes an existing registration and returns true", () => {
    const event = makeFutureEvent();
    const result = registerForEvent({ eventId: event.id, userId: "user-1" });
    if (!result.success) throw new Error("Setup failed");

    const deleted = unregisterFromEvent(result.registration.id);
    expect(deleted).toBe(true);
    expect(store.registrations.has(result.registration.id)).toBe(false);
  });

  it("frees up a spot after unregistering", () => {
    const event = makeFutureEvent(1);
    const r1 = registerForEvent({ eventId: event.id, userId: "user-1" });
    if (!r1.success) throw new Error("Setup failed");

    // At capacity — third user should fail
    const blocked = registerForEvent({ eventId: event.id, userId: "user-2" });
    expect(blocked.success).toBe(false);

    // After unregistering, the spot opens
    unregisterFromEvent(r1.registration.id);
    const freed = registerForEvent({ eventId: event.id, userId: "user-2" });
    expect(freed.success).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// getRegistrationsByEvent
// ---------------------------------------------------------------------------

describe("getRegistrationsByEvent", () => {
  beforeEach(resetStore);

  it("returns an empty array for an event with no registrations", () => {
    const event = makeFutureEvent();
    expect(getRegistrationsByEvent(event.id)).toEqual([]);
  });

  it("returns only registrations for the requested event", () => {
    const event1 = makeFutureEvent();
    const event2 = makeFutureEvent();
    registerForEvent({ eventId: event1.id, userId: "user-1" });
    registerForEvent({ eventId: event2.id, userId: "user-2" });

    const results = getRegistrationsByEvent(event1.id);
    expect(results).toHaveLength(1);
    expect(results[0].userId).toBe("user-1");
  });
});
