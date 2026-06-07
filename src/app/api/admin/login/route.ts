import { NextResponse } from "next/server";
import { parseJsonBody } from "@/lib/utils/api";
import { adminCookieOptions, getAdminToken } from "@/lib/admin-auth";
import { createHash } from "crypto";

export async function POST(req: Request): Promise<NextResponse> {
  const body = await parseJsonBody<{ password: string }>(req);

  if (!body?.password) {
    return NextResponse.json({ success: false, error: "Password required." }, { status: 400 });
  }

  const expected = getAdminToken();
  const provided = createHash("sha256").update(body.password).digest("hex");

  if (provided !== expected) {
    return NextResponse.json({ success: false, error: "Incorrect password." }, { status: 401 });
  }

  const res = NextResponse.json({ success: true });
  res.cookies.set(adminCookieOptions(60 * 60 * 8)); // 8 hours
  return res;
}
