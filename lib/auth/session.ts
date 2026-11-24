import "server-only";

import { prisma } from "@/lib/db";
import { getServerEnv } from "@/lib/env";
import { generateSessionToken, hashSessionToken } from "@/lib/auth/session-token";

const DEFAULT_MAX_AGE_SECONDS = 60 * 60 * 24 * 7;

export function getSessionCookieName(): string {
  return getServerEnv().SESSION_COOKIE_NAME ?? "session";
}

export function getSessionMaxAgeSeconds(): number {
  return getServerEnv().SESSION_MAX_AGE_SECONDS ?? DEFAULT_MAX_AGE_SECONDS;
}

export type SessionCookieOptions = {
  name: string;
  value: string;
  maxAge: number;
  httpOnly: true;
  secure: boolean;
  sameSite: "lax";
  path: "/";
};

export function buildSessionCookieOptions(token: string): SessionCookieOptions {
  const isProd = process.env.NODE_ENV === "production";
  return {
    name: getSessionCookieName(),
    value: token,
    maxAge: getSessionMaxAgeSeconds(),
    httpOnly: true,
    secure: isProd,
    sameSite: "lax",
    path: "/",
  };
}

export function buildClearSessionCookieOptions(): Omit<
  SessionCookieOptions,
  "value"
> & {
  value: "";
} {
  const { name, httpOnly, secure, sameSite, path } = buildSessionCookieOptions("");
  return { name, value: "", maxAge: 0, httpOnly, secure, sameSite, path };
}

export async function createSession(params: {
  userId: string;
  ip?: string | null;
  userAgent?: string | null;
}): Promise<{ token: string; sessionId: string; expiresAt: Date }> {
  const token = generateSessionToken();
  const tokenHash = hashSessionToken(token);
  const expiresAt = new Date(Date.now() + getSessionMaxAgeSeconds() * 1000);

  const session = await prisma.session.create({
    data: {
      userId: params.userId,
      tokenHash,
      expiresAt,
      ip: params.ip ?? null,
      userAgent: params.userAgent ?? null,
    },
  });

  return { token, sessionId: session.id, expiresAt };
}

export async function deleteSessionByToken(rawToken: string): Promise<void> {
  const tokenHash = hashSessionToken(rawToken);
  await prisma.session.deleteMany({ where: { tokenHash } });
}

export async function revokeAllSessionsForUser(userId: string): Promise<void> {
  await prisma.session.deleteMany({ where: { userId } });
}

export async function findSessionUserId(rawToken: string): Promise<string | null> {
  const tokenHash = hashSessionToken(rawToken);
  const session = await prisma.session.findUnique({
    where: { tokenHash },
    select: {
      userId: true,
      expiresAt: true,
      user: { select: { status: true } },
    },
  });

  if (!session) {
    return null;
  }
  if (session.expiresAt <= new Date()) {
    await prisma.session.deleteMany({ where: { tokenHash } });
    return null;
  }
  if (session.user.status !== "ACTIVE") {
    return null;
  }
  return session.userId;
}
