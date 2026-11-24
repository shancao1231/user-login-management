import "server-only";

import { NextResponse } from "next/server";
import {
  buildClearSessionCookieOptions,
  buildSessionCookieOptions,
} from "@/lib/auth/session";

export function applySessionCookie(response: NextResponse, token: string): void {
  const options = buildSessionCookieOptions(token);
  response.cookies.set(options);
}

export function clearSessionCookie(response: NextResponse): void {
  const options = buildClearSessionCookieOptions();
  response.cookies.set(options);
}
