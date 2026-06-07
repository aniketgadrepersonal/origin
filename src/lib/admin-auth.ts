/**
 * Admin authentication helper.
 * Uses a simple sha256 cookie — good enough for a dev/demo environment.
 */

import { createHash } from "crypto";
import { cookies } from "next/headers";

const COOKIE_NAME = "admin_token";

export function getAdminToken(): string {
  const password = process.env.ADMIN_PASSWORD ?? "";
  return createHash("sha256").update(password).digest("hex");
}

export function isAdminRequest(): boolean {
  const cookieStore = cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  return !!token && token === getAdminToken();
}

export function adminCookieOptions(maxAge: number) {
  return {
    name: COOKIE_NAME,
    value: getAdminToken(),
    httpOnly: true,
    sameSite: "strict" as const,
    path: "/",
    maxAge,
  };
}
