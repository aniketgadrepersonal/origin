/**
 * Unit tests for input validators.
 */

import {
  validateCreateEvent,
  validateUpdateEvent,
  validateCreateRegistration,
} from "@/lib/validators";

function futureDate(daysAhead = 7): string {
  const d = new Date();
  d.setDate(d.getDate() + daysAhead);
  return d.toISOString();
}

function pastDate(): string {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return d.toISOString();
}

// ---------------------------------------------------------------------------
// validateCreateEvent
// ---------------------------------------------------------------------------

describe("validateCreateEvent", () => {
  const valid = {
    title: "My Event",
    description: "A description",
    date: futureDate(),
    maxCapacity: 50,
  };

  it("returns no errors for valid input", () => {
    expect(validateCreateEvent(valid)).toHaveLength(0);
  });

  it("errors when title is missing", () => {
    const errors = validateCreateEvent({ ...valid, title: "" });
    expect(errors.some((e) => e.field === "title")).toBe(true);
  });

  it("errors when title exceeds 200 characters", () => {
    const errors = validateCreateEvent({ ...valid, title: "a".repeat(201) });
    expect(errors.some((e) => e.field === "title")).toBe(true);
  });

  it("errors when description is missing", () => {
    const errors = validateCreateEvent({ ...valid, description: "" });
    expect(errors.some((e) => e.field === "description")).toBe(true);
  });

  it("errors when date is not a valid ISO string", () => {
    const errors = validateCreateEvent({ ...valid, date: "not-a-date" });
    expect(errors.some((e) => e.field === "date")).toBe(true);
  });

  it("errors when date is in the past", () => {
    const errors = validateCreateEvent({ ...valid, date: pastDate() });
    expect(errors.some((e) => e.field === "date")).toBe(true);
  });

  it("errors when maxCapacity is zero", () => {
    const errors = validateCreateEvent({ ...valid, maxCapacity: 0 });
    expect(errors.some((e) => e.field === "maxCapacity")).toBe(true);
  });

  it("errors when maxCapacity is negative", () => {
    const errors = validateCreateEvent({ ...valid, maxCapacity: -5 });
    expect(errors.some((e) => e.field === "maxCapacity")).toBe(true);
  });

  it("errors when maxCapacity is a float", () => {
    const errors = validateCreateEvent({ ...valid, maxCapacity: 1.5 });
    expect(errors.some((e) => e.field === "maxCapacity")).toBe(true);
  });

  it("errors when maxCapacity exceeds 50", () => {
    const errors = validateCreateEvent({ ...valid, maxCapacity: 51 });
    expect(errors.some((e) => e.field === "maxCapacity")).toBe(true);
  });

  it("passes when maxCapacity is exactly 50", () => {
    expect(validateCreateEvent({ ...valid, maxCapacity: 50 })).toHaveLength(0);
  });

  it("can return multiple errors at once", () => {
    const errors = validateCreateEvent({ title: "", description: "", date: "bad", maxCapacity: -1 });
    expect(errors.length).toBeGreaterThanOrEqual(3);
  });
});

// ---------------------------------------------------------------------------
// validateUpdateEvent
// ---------------------------------------------------------------------------

describe("validateUpdateEvent", () => {
  it("returns no errors for an empty patch (all fields optional)", () => {
    expect(validateUpdateEvent({})).toHaveLength(0);
  });

  it("errors when provided title is an empty string", () => {
    const errors = validateUpdateEvent({ title: "" });
    expect(errors.some((e) => e.field === "title")).toBe(true);
  });

  it("passes when only a valid title is provided", () => {
    expect(validateUpdateEvent({ title: "New Title" })).toHaveLength(0);
  });

  it("errors when provided date is in the past", () => {
    const errors = validateUpdateEvent({ date: pastDate() });
    expect(errors.some((e) => e.field === "date")).toBe(true);
  });

  it("errors when provided maxCapacity is not a positive integer", () => {
    const errors = validateUpdateEvent({ maxCapacity: 0 });
    expect(errors.some((e) => e.field === "maxCapacity")).toBe(true);
  });

  it("errors when provided maxCapacity exceeds 50", () => {
    const errors = validateUpdateEvent({ maxCapacity: 51 });
    expect(errors.some((e) => e.field === "maxCapacity")).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// validateCreateRegistration
// ---------------------------------------------------------------------------

describe("validateCreateRegistration", () => {
  const valid = { eventId: "abc", name: "Jane Smith", email: "jane@example.com" };

  it("returns no errors for valid input", () => {
    expect(validateCreateRegistration(valid)).toHaveLength(0);
  });

  it("passes with optional aboutMe included", () => {
    expect(validateCreateRegistration({ ...valid, aboutMe: "Engineer" })).toHaveLength(0);
  });

  it("errors when eventId is missing", () => {
    const errors = validateCreateRegistration({ ...valid, eventId: "" });
    expect(errors.some((e) => e.field === "eventId")).toBe(true);
  });

  it("errors when name is missing", () => {
    const errors = validateCreateRegistration({ ...valid, name: "" });
    expect(errors.some((e) => e.field === "name")).toBe(true);
  });

  it("errors when email is missing", () => {
    const errors = validateCreateRegistration({ ...valid, email: "" });
    expect(errors.some((e) => e.field === "email")).toBe(true);
  });

  it("errors when email format is invalid", () => {
    const errors = validateCreateRegistration({ ...valid, email: "not-an-email" });
    expect(errors.some((e) => e.field === "email")).toBe(true);
  });

  it("errors when all required fields are missing", () => {
    const errors = validateCreateRegistration({});
    expect(errors.length).toBeGreaterThanOrEqual(3);
  });
});
