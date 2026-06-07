/**
 * DELETE /api/registrations/[id]  — unregister a user from an event
 */

import { NextResponse } from "next/server";
import { unregisterFromEvent } from "@/lib/registrations";
import { successResponse, errorResponse } from "@/lib/utils/api";

interface RouteContext {
  params: { id: string };
}

export async function DELETE(
  _req: Request,
  { params }: RouteContext
): Promise<NextResponse> {
  const deleted = unregisterFromEvent(params.id);

  if (!deleted) {
    return errorResponse("Registration not found.", 404);
  }

  return successResponse(null, "Unregistered successfully.");
}
