import { NextResponse } from "next/server";
import { isAdminRequest } from "@/lib/admin-auth";

export async function GET(): Promise<NextResponse> {
  return NextResponse.json({ isAdmin: isAdminRequest() });
}
