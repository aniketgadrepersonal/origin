import { NextResponse } from "next/server";
import { isAdminRequest } from "@/lib/admin-auth";
import { getRegistrationsByEvent } from "@/lib/registrations";
import { getEventById } from "@/lib/events";
import { errorResponse } from "@/lib/utils/api";

interface RouteContext {
  params: { id: string };
}

export async function GET(
  _req: Request,
  { params }: RouteContext
): Promise<NextResponse> {
  if (!isAdminRequest()) {
    return errorResponse("Unauthorized.", 401);
  }

  const event = getEventById(params.id);
  if (!event) {
    return errorResponse("Event not found.", 404);
  }

  const registrations = getRegistrationsByEvent(params.id);
  return NextResponse.json({ success: true, data: registrations });
}
