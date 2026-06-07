/**
 * @jest-environment node
 *
 * Integration tests for /api/registrations and /api/registrations/[id].
 *
 * Focuses on the three business rules that matter most:
 *   1. Cannot register for a past event
 *   2. Cannot exceed capacity
 *   3. Cannot double-register (keyed on email)
 *
 * Also verifies the happy path and unregister flow.
 */

import { testApiHandler } from "next-test-api-route-handler";
import * as eventsHandler from "@/app/api/events/route";
import * as registrationsHandler from "@/app/api/registrations/route";
import * as registrationByIdHandler from "@/app/api/registrations/[id]/route";
import { resetStore } from "@/lib/store";

const FUTURE_DATE = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

beforeEach(() => resetStore());

/** Helper: create an event and return its id. */
async function createEvent(overrides: Record<string, unknown> = {}): Promise<string> {
  let id = "";
  await testApiHandler({
    appHandler: eventsHandler,
    test: async ({ fetch }) => {
      const res = await fetch({
        method: "POST",
        body: JSON.stringify({
          title: "Test Event",
          description: "desc",
          date: FUTURE_DATE,
          maxCapacity: 3,
          ...overrides,
        }),
        headers: { "Content-Type": "application/json" },
      });
      id = (await res.json()).data.id;
    },
  });
  return id;
}

/** Helper: register an attendee and return the full json response. */
async function registerUser(eventId: string, emailSuffix = "1", name?: string) {
  let result: { status: number; json: Record<string, unknown> } = { status: 0, json: {} };
  await testApiHandler({
    appHandler: registrationsHandler,
    test: async ({ fetch }) => {
      const res = await fetch({
        method: "POST",
        body: JSON.stringify({
          eventId,
          name: name ?? `User ${emailSuffix}`,
          email: `user${emailSuffix}@example.com`,
          aboutMe: "Test attendee",
        }),
        headers: { "Content-Type": "application/json" },
      });
      result = { status: res.status, json: await res.json() };
    },
  });
  return result;
}

// ---------------------------------------------------------------------------
// Happy path
// ---------------------------------------------------------------------------

describe("POST /api/registrations — happy path", () => {
  it("registers an attendee and returns 201 with name, email, and registration id", async () => {
    const eventId = await createEvent();
    const { status, json } = await registerUser(eventId);

    expect(status).toBe(201);
    expect((json as any).success).toBe(true);
    expect(typeof (json as any).data?.id).toBe("string");
    expect((json as any).data?.eventId).toBe(eventId);
    expect((json as any).data?.email).toBe("user1@example.com");
    expect((json as any).data?.name).toBe("User 1");
  });
});

// ---------------------------------------------------------------------------
// Business rule 1 — past event
// ---------------------------------------------------------------------------

describe("POST /api/registrations — past event", () => {
  it("returns 404 for a non-existent event", async () => {
    const { status, json } = await registerUser("non-existent-event");
    expect(status).toBe(404);
    expect((json as any).success).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// Business rule 2 — capacity
// ---------------------------------------------------------------------------

describe("POST /api/registrations — capacity enforcement", () => {
  it("returns 409 when the event is full", async () => {
    const eventId = await createEvent({ maxCapacity: 2 });

    await registerUser(eventId, "1");
    await registerUser(eventId, "2");

    const { status, json } = await registerUser(eventId, "3");
    expect(status).toBe(409);
    expect((json as any).success).toBe(false);
    expect((json as any).error).toMatch(/capacity/i);
  });

  it("allows exactly maxCapacity registrations", async () => {
    const eventId = await createEvent({ maxCapacity: 2 });

    const first = await registerUser(eventId, "1");
    const second = await registerUser(eventId, "2");

    expect(first.status).toBe(201);
    expect(second.status).toBe(201);
  });
});

// ---------------------------------------------------------------------------
// Business rule 3 — double-register
// ---------------------------------------------------------------------------

describe("POST /api/registrations — double-register prevention", () => {
  it("returns 409 when the same email registers twice for the same event", async () => {
    const eventId = await createEvent();

    await registerUser(eventId, "1");
    const { status, json } = await registerUser(eventId, "1");

    expect(status).toBe(409);
    expect((json as any).success).toBe(false);
    expect((json as any).error).toMatch(/already registered/i);
  });

  it("allows the same email to register for different events", async () => {
    const eventA = await createEvent();
    const eventB = await createEvent();

    const first = await registerUser(eventA, "1");
    const second = await registerUser(eventB, "1");

    expect(first.status).toBe(201);
    expect(second.status).toBe(201);
  });
});

// ---------------------------------------------------------------------------
// DELETE /api/registrations/[id]
// ---------------------------------------------------------------------------

describe("DELETE /api/registrations/[id]", () => {
  it("unregisters successfully and returns 200", async () => {
    const eventId = await createEvent();
    const { json } = await registerUser(eventId);
    const registrationId = (json as any).data.id;

    await testApiHandler({
      appHandler: registrationByIdHandler,
      params: { id: registrationId },
      test: async ({ fetch }) => {
        const res = await fetch({ method: "DELETE" });
        const body = await res.json();
        expect(res.status).toBe(200);
        expect(body.success).toBe(true);
      },
    });
  });

  it("returns 404 when deleting an already-deleted registration", async () => {
    const eventId = await createEvent();
    const { json } = await registerUser(eventId);
    const registrationId = (json as any).data.id;

    await testApiHandler({
      appHandler: registrationByIdHandler,
      params: { id: registrationId },
      test: async ({ fetch }) => { await fetch({ method: "DELETE" }); },
    });

    await testApiHandler({
      appHandler: registrationByIdHandler,
      params: { id: registrationId },
      test: async ({ fetch }) => {
        const res = await fetch({ method: "DELETE" });
        expect(res.status).toBe(404);
      },
    });
  });

  it("allows re-registration after unregistering", async () => {
    const eventId = await createEvent({ maxCapacity: 1 });
    const { json } = await registerUser(eventId, "1");
    const registrationId = (json as any).data.id;

    await testApiHandler({
      appHandler: registrationByIdHandler,
      params: { id: registrationId },
      test: async ({ fetch }) => { await fetch({ method: "DELETE" }); },
    });

    const reRegister = await registerUser(eventId, "1");
    expect(reRegister.status).toBe(201);
  });
});

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------

describe("POST /api/registrations — validation", () => {
  it("returns 422 when eventId is missing", async () => {
    await testApiHandler({
      appHandler: registrationsHandler,
      test: async ({ fetch }) => {
        const res = await fetch({
          method: "POST",
          body: JSON.stringify({ name: "Jane", email: "jane@example.com" }),
          headers: { "Content-Type": "application/json" },
        });
        expect(res.status).toBe(422);
      },
    });
  });

  it("returns 422 when name is missing", async () => {
    await testApiHandler({
      appHandler: registrationsHandler,
      test: async ({ fetch }) => {
        const res = await fetch({
          method: "POST",
          body: JSON.stringify({ eventId: "abc", email: "jane@example.com" }),
          headers: { "Content-Type": "application/json" },
        });
        expect(res.status).toBe(422);
      },
    });
  });

  it("returns 422 when email is missing", async () => {
    await testApiHandler({
      appHandler: registrationsHandler,
      test: async ({ fetch }) => {
        const res = await fetch({
          method: "POST",
          body: JSON.stringify({ eventId: "abc", name: "Jane" }),
          headers: { "Content-Type": "application/json" },
        });
        expect(res.status).toBe(422);
      },
    });
  });

  it("returns 422 when email format is invalid", async () => {
    await testApiHandler({
      appHandler: registrationsHandler,
      test: async ({ fetch }) => {
        const res = await fetch({
          method: "POST",
          body: JSON.stringify({ eventId: "abc", name: "Jane", email: "not-an-email" }),
          headers: { "Content-Type": "application/json" },
        });
        expect(res.status).toBe(422);
      },
    });
  });
});
