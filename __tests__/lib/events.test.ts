/**
 * Unit tests for the events service.
 *
 * The in-memory store is reset before each test so tests are fully isolated
 * and order-independent.
 */

import { getAllEvents, getEventById, createEvent, updateEvent } from "@/lib/events";
import store from "@/lib/store";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function resetStore() {
  store.events.clear();
  store.registrations.clear();
}

/** Returns a valid future date string */
function futureDate(daysAhead = 7): string {
  const d = new Date();
  d.setDate(d.getDate() + daysAhead);
  return d.toISOString();
}

function makeEvent(overrides = {}) {
  return createEvent({
    title: "Test Event",
    description: "A test event",
    date: futureDate(),
    maxCapacity: 10,
    ...overrides,
  });
}

// ---------------------------------------------------------------------------
// getAllEvents
// ---------------------------------------------------------------------------

describe("getAllEvents", () => {
  beforeEach(resetStore);

  it("returns an empty array when there are no events", () => {
    expect(getAllEvents()).toEqual([]);
  });

  it("returns all created events", () => {
    makeEvent({ title: "Event A" });
    makeEvent({ title: "Event B" });
    const events = getAllEvents();
    expect(events).toHaveLength(2);
  });

  it("returns events sorted by date ascending", () => {
    makeEvent({ title: "Later", date: futureDate(14) });
    makeEvent({ title: "Sooner", date: futureDate(3) });
    const events = getAllEvents();
    expect(events[0].title).toBe("Sooner");
    expect(events[1].title).toBe("Later");
  });

  it("enriches events with availability data", () => {
    const event = makeEvent({ maxCapacity: 5 });
    const [result] = getAllEvents();
    expect(result.registrationCount).toBe(0);
    expect(result.availableSpots).toBe(5);
    expect(result.isFull).toBe(false);
    expect(result.id).toBe(event.id);
  });
});

// ---------------------------------------------------------------------------
// getEventById
// ---------------------------------------------------------------------------

describe("getEventById", () => {
  beforeEach(resetStore);

  it("returns null for a non-existent id", () => {
    expect(getEventById("does-not-exist")).toBeNull();
  });

  it("returns the correct event by id", () => {
    const created = makeEvent({ title: "Specific Event" });
    const found = getEventById(created.id);
    expect(found).not.toBeNull();
    expect(found!.title).toBe("Specific Event");
  });
});

// ---------------------------------------------------------------------------
// createEvent
// ---------------------------------------------------------------------------

describe("createEvent", () => {
  beforeEach(resetStore);

  it("persists and returns the new event with a generated id", () => {
    const event = makeEvent();
    expect(event.id).toBeDefined();
    expect(store.events.has(event.id)).toBe(true);
  });

  it("trims whitespace from title and description", () => {
    const event = createEvent({
      title: "  Padded Title  ",
      description: "  Some description  ",
      date: futureDate(),
      maxCapacity: 5,
    });
    expect(event.title).toBe("Padded Title");
    expect(event.description).toBe("Some description");
  });

  it("sets createdAt and updatedAt on creation", () => {
    const event = makeEvent();
    expect(event.createdAt).toBeDefined();
    expect(event.updatedAt).toBeDefined();
    expect(event.createdAt).toBe(event.updatedAt);
  });
});

// ---------------------------------------------------------------------------
// updateEvent
// ---------------------------------------------------------------------------

describe("updateEvent", () => {
  beforeEach(resetStore);

  it("returns null event for a non-existent id", () => {
    const { event } = updateEvent("ghost-id", { title: "New Title" });
    expect(event).toBeNull();
  });

  it("patches only the provided fields", () => {
    const created = makeEvent({ title: "Original", maxCapacity: 20 });
    const { event } = updateEvent(created.id, { title: "Updated" });
    expect(event!.title).toBe("Updated");
    expect(event!.maxCapacity).toBe(20);
  });

  it("updates the updatedAt timestamp", async () => {
    const created = makeEvent();
    // Small delay to ensure timestamps differ
    await new Promise((r) => setTimeout(r, 5));
    const { event } = updateEvent(created.id, { title: "Changed" });
    expect(event!.updatedAt > created.updatedAt).toBe(true);
  });

  it("returns an error when reducing capacity below registration count", () => {
    const created = makeEvent({ maxCapacity: 2 });
    // Manually insert registrations to simulate a full event
    store.registrations.set("r1", {
      id: "r1",
      eventId: created.id,
      userId: "user-1",
      registeredAt: new Date().toISOString(),
    });
    store.registrations.set("r2", {
      id: "r2",
      eventId: created.id,
      userId: "user-2",
      registeredAt: new Date().toISOString(),
    });

    const { event, error } = updateEvent(created.id, { maxCapacity: 1 });
    expect(event).toBeNull();
    expect(error).toMatch(/capacity/i);
  });
});
