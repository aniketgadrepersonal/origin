import { NextResponse } from "next/server";

export async function POST(): Promise<NextResponse> {
  const res = NextResponse.json({ success: true });
  res.cookies.set({ name: "admin_token", value: "", maxAge: 0, path: "/" });
  return res;
}
