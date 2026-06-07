/**
 * POST /api/registrations  — register a user for an event
 */

import { NextResponse } from "next/server";
import { registerForEvent } from "@/lib/registrations";
import { validateCreateRegistration } from "@/lib/validators";
import {
  successResponse,
  errorResponse,
  validationErrorResponse,
  parseJsonBody,
} from "@/lib/utils/api";
import type { CreateRegistrationInput } from "@/types";

export async function POST(req: Request): Promise<NextResponse> {
  const body = await parseJsonBody<Partial<CreateRegistrationInput>>(req);

  if (!body) {
    return errorResponse("Request body is missing or not valid JSON.", 400);
  }

  const errors = validateCreateRegistration(body);
  if (errors.length > 0) {
    return validationErrorResponse(errors);
  }

  const result = registerForEvent(body as CreateRegistrationInput);

  if (!result.success) {
    return errorResponse(result.error, result.statusCode);
  }

  return successResponse(
    result.registration,
    "Registration successful.",
    201
  );
}
