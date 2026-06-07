/**
 * GET   /api/events/[id]  — get a single event
 * PATCH /api/events/[id]  — partially update an event
 */

import { NextResponse } from "next/server";
import { getEventById, updateEvent } from "@/lib/events";
import { validateUpdateEvent } from "@/lib/validators";
import {
  successResponse,
  errorResponse,
  validationErrorResponse,
  parseJsonBody,
} from "@/lib/utils/api";
import type { UpdateEventInput } from "@/types";

interface RouteContext {
  params: { id: string };
}

export async function GET(
  _req: Request,
  { params }: RouteContext
): Promise<NextResponse> {
  const event = getEventById(params.id);
  if (!event) {
    return errorResponse("Event not found.", 404);
  }
  return successResponse(event);
}

export async function PATCH(
  req: Request,
  { params }: RouteContext
): Promise<NextResponse> {
  const body = await parseJsonBody<Partial<UpdateEventInput>>(req);

  if (!body) {
    return errorResponse("Request body is missing or not valid JSON.", 400);
  }

  const errors = validateUpdateEvent(body);
  if (errors.length > 0) {
    return validationErrorResponse(errors);
  }

  const { event, error } = updateEvent(params.id, body);

  if (error) {
    return errorResponse(error, 409);
  }

  if (!event) {
    return errorResponse("Event not found.", 404);
  }

  return successResponse(event, "Event updated successfully.");
}
