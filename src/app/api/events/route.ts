/**
 * GET  /api/events      — list all events
 * POST /api/events      — create a new event
 */

import { NextResponse } from "next/server";
import { getAllEvents, createEvent } from "@/lib/events";
import { validateCreateEvent } from "@/lib/validators";
import {
  successResponse,
  errorResponse,
  validationErrorResponse,
  parseJsonBody,
} from "@/lib/utils/api";
import type { CreateEventInput } from "@/types";

export async function GET(): Promise<NextResponse> {
  const events = getAllEvents();
  return successResponse(events);
}

export async function POST(req: Request): Promise<NextResponse> {
  const body = await parseJsonBody<Partial<CreateEventInput>>(req);

  if (!body) {
    return errorResponse("Request body is missing or not valid JSON.", 400);
  }

  const errors = validateCreateEvent(body);
  if (errors.length > 0) {
    return validationErrorResponse(errors);
  }

  const event = createEvent(body as CreateEventInput);
  return successResponse(event, "Event created successfully.", 201);
}
