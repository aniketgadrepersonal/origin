/**
 * Shared API utilities.
 *
 * Centralising response construction means every route returns a consistent
 * envelope shape and HTTP status code — easier for the frontend to handle and
 * easier for tests to assert.
 */

import { NextResponse } from "next/server";
import type { ApiResponse, ValidationError } from "@/types";

// ---------------------------------------------------------------------------
// Response builders
// ---------------------------------------------------------------------------

export function successResponse<T>(
  data: T,
  message?: string,
  status = 200
): NextResponse<ApiResponse<T>> {
  return NextResponse.json({ success: true, data, message }, { status });
}

export function errorResponse(
  error: string,
  status = 400
): NextResponse<ApiResponse<never>> {
  return NextResponse.json({ success: false, error }, { status });
}

export function validationErrorResponse(
  errors: ValidationError[]
): NextResponse<ApiResponse<never>> {
  const message = errors.map((e) => `${e.field}: ${e.message}`).join(" | ");
  return NextResponse.json(
    { success: false, error: "Validation failed.", message },
    { status: 422 }
  );
}

// ---------------------------------------------------------------------------
// Request helpers
// ---------------------------------------------------------------------------

/**
 * Safely parses the JSON body of an incoming request.
 * Returns null if the body is missing or malformed, preventing unhandled
 * JSON parse exceptions from crashing the route handler.
 */
export async function parseJsonBody<T = Record<string, unknown>>(
  req: Request
): Promise<T | null> {
  try {
    const text = await req.text();
    if (!text) return null;
    return JSON.parse(text) as T;
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// Rate limiting note
// ---------------------------------------------------------------------------
// In production, add rate limiting middleware here (e.g. upstash/ratelimit).
// Kept out of scope for this exercise but the abstraction point is ready.
