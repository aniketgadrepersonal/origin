/**
 * @jest-environment node
 *
 * Integration tests for /api/events and /api/events/[id].
 *
 * These tests exercise the full route handler stack — request parsing,
 * validation, service layer, and response envelope — without spinning up
 * a real HTTP server. next-test-api-route-handler wraps the App Router
 * handlers directly.
 */

import { testApiHandler } from "next-test-api-route-handler";
import * as eventsHandler from "@/app/api/events/route";
import * as eventByIdHandler from "@/app/api/events/[id]/route";
import { resetStore } from "@/lib/store";

// A future date used across tests
const FUTURE_DATE = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

const BASE_EVENT = {
  title: "Test Event",
  description: "A test event",
  date: FUTURE_DATE,
  maxCapacity: 10,
};

beforeEach(() => resetStore());

// ---------------------------------------------------------------------------
// GET /api/events
// ---------------------------------------------------------------------------

describe("GET /api/events", () => {
  it("returns an empty list when no events exist", async () => {
    await testApiHandler({
      appHandler: eventsHandler,
      test: async ({ fetch }) => {
        const res = await fetch({ method: "GET" });
        const json = await res.json();
        expect(res.status).toBe(200);
        expect(json.success).toBe(true);
        expect(json.data).toEqual([]);
      },
    });
  });

  it("returns created events", async () => {
    // Create one first via POST
    await testApiHandler({
      appHandler: eventsHandler,
      test: async ({ fetch }) => {
        await fetch({
          method: "POST",
          body: JSON.stringify(BASE_EVENT),
          headers: { "Content-Type": "application/json" },
        });
      },
    });

    await testApiHandler({
      appHandler: eventsHandler,
      test: async ({ fetch }) => {
        const res = await fetch({ method: "GET" });
        const json = await res.json();
        expect(res.status).toBe(200);
        expect(json.data).toHaveLength(1);
        expect(json.data[0].title).toBe("Test Event");
        expect(json.data[0].availableSpots).toBe(10);
        expect(json.data[0].registrationCount).toBe(0);
      },
    });
  });
});

// ---------------------------------------------------------------------------
// POST /api/events
// ---------------------------------------------------------------------------

describe("POST /api/events", () => {
  it("creates an event and returns 201 with the event object", async () => {
    await testApiHandler({
      appHandler: eventsHandler,
      test: async ({ fetch }) => {
        const res = await fetch({
          method: "POST",
          body: JSON.stringify(BASE_EVENT),
          headers: { "Content-Type": "application/json" },
        });
        const json = await res.json();
        expect(res.status).toBe(201);
        expect(json.success).toBe(true);
        expect(json.data).toMatchObject({
          title: "Test Event",
          maxCapacity: 10,
          availableSpots: 10,
          registrationCount: 0,
          isFull: false,
        });
        expect(typeof json.data.id).toBe("string");
      },
    });
  });

  it("returns 422 when required fields are missing", async () => {
    await testApiHandler({
      appHandler: eventsHandler,
      test: async ({ fetch }) => {
        const res = await fetch({
          method: "POST",
          body: JSON.stringify({ title: "No date or capacity" }),
          headers: { "Content-Type": "application/json" },
        });
        const json = await res.json();
        expect(res.status).toBe(422);
        expect(json.success).toBe(false);
      },
    });
  });

  it("returns 422 when date is in the past", async () => {
    await testApiHandler({
      appHandler: eventsHandler,
      test: async ({ fetch }) => {
        const res = await fetch({
          method: "POST",
          body: JSON.stringify({ ...BASE_EVENT, date: "2020-01-01T00:00:00Z" }),
          headers: { "Content-Type": "application/json" },
        });
        const json = await res.json();
        expect(res.status).toBe(422);
        expect(json.success).toBe(false);
      },
    });
  });

  it("returns 400 on malformed JSON", async () => {
    await testApiHandler({
      appHandler: eventsHandler,
      test: async ({ fetch }) => {
        const res = await fetch({
          method: "POST",
          body: "not json",
          headers: { "Content-Type": "application/json" },
        });
        const json = await res.json();
        expect(res.status).toBe(400);
        expect(json.success).toBe(false);
      },
    });
  });
});

// ---------------------------------------------------------------------------
// GET /api/events/[id]
// ---------------------------------------------------------------------------

describe("GET /api/events/[id]", () => {
  it("returns the event when it exists", async () => {
    let eventId: string;

    await testApiHandler({
      appHandler: eventsHandler,
      test: async ({ fetch }) => {
        const res = await fetch({
          method: "POST",
          body: JSON.stringify(BASE_EVENT),
          headers: { "Content-Type": "application/json" },
        });
        const json = await res.json();
        eventId = json.data.id;
      },
    });

    await testApiHandler({
      appHandler: eventByIdHandler,
      params: { id: eventId! },
      test: async ({ fetch }) => {
        const res = await fetch({ method: "GET" });
        const json = await res.json();
        expect(res.status).toBe(200);
        expect(json.data.id).toBe(eventId);
      },
    });
  });

  it("returns 404 for a non-existent id", async () => {
    await testApiHandler({
      appHandler: eventByIdHandler,
      params: { id: "does-not-exist" },
      test: async ({ fetch }) => {
        const res = await fetch({ method: "GET" });
        const json = await res.json();
        expect(res.status).toBe(404);
        expect(json.success).toBe(false);
      },
    });
  });
});

// ---------------------------------------------------------------------------
// PATCH /api/events/[id]
// ---------------------------------------------------------------------------

describe("PATCH /api/events/[id]", () => {
  it("partially updates an event", async () => {
    let eventId: string;

    await testApiHandler({
      appHandler: eventsHandler,
      test: async ({ fetch }) => {
        const res = await fetch({
          method: "POST",
          body: JSON.stringify(BASE_EVENT),
          headers: { "Content-Type": "application/json" },
        });
        eventId = (await res.json()).data.id;
      },
    });

    await testApiHandler({
      appHandler: eventByIdHandler,
      params: { id: eventId! },
      test: async ({ fetch }) => {
        const res = await fetch({
          method: "PATCH",
          body: JSON.stringify({ title: "Updated Title" }),
          headers: { "Content-Type": "application/json" },
        });
        const json = await res.json();
        expect(res.status).toBe(200);
        expect(json.data.title).toBe("Updated Title");
        expect(json.data.maxCapacity).toBe(10); // unchanged
      },
    });
  });

  it("returns 404 when patching a non-existent event", async () => {
    await testApiHandler({
      appHandler: eventByIdHandler,
      params: { id: "ghost-id" },
      test: async ({ fetch }) => {
        const res = await fetch({
          method: "PATCH",
          body: JSON.stringify({ title: "X" }),
          headers: { "Content-Type": "application/json" },
        });
        expect(res.status).toBe(404);
      },
    });
  });
});
