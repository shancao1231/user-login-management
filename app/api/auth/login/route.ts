import { verifyPassword } from "@/lib/auth/password";
import { createSession } from "@/lib/auth/session";
import { writeAuditLog } from "@/lib/audit";
import { prisma } from "@/lib/db";
import { getClientIp, getUserAgent } from "@/lib/http/request-meta";
import { applySessionCookie } from "@/lib/http/set-session-cookie";
import { consumeRateLimit, rateLimitKey } from "@/lib/rate-limit";
import { parseBody } from "@/lib/validation/parse";
import { loginBodySchema } from "@/lib/validation/auth";
import { NextResponse, type NextRequest } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const INVALID_CREDENTIALS = "邮箱或密码错误";

export async function POST(request: NextRequest) {
  const ip = getClientIp(request);
  const ua = getUserAgent(request);

  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return NextResponse.json({ error: "无效的 JSON" }, { status: 400 });
  }

  const parsed = parseBody(loginBodySchema, json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error, issues: parsed.issues },
      { status: 400 },
    );
  }

  const { email, password } = parsed.data;
  const limitKey = rateLimitKey(["login", ip, email]);
  if (!(await consumeRateLimit(limitKey, 8, 15 * 60_000))) {
    return NextResponse.json({ error: "登录尝试过多，请稍后再试" }, { status: 429 });
  }

  const user = await prisma.user.findFirst({
    where: { email, deletedAt: null },
    select: { id: true, email: true, passwordHash: true, status: true },
  });

  if (!user || user.status !== "ACTIVE") {
    return NextResponse.json({ error: INVALID_CREDENTIALS }, { status: 401 });
  }

  const valid = await verifyPassword(password, user.passwordHash);
  if (!valid) {
    return NextResponse.json({ error: INVALID_CREDENTIALS }, { status: 401 });
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { lastLoginAt: new Date() },
  });

  const { token } = await createSession({
    userId: user.id,
    ip,
    userAgent: ua,
  });

  await writeAuditLog({
    actorId: user.id,
    action: "auth.login",
    targetType: "user",
    targetId: user.id,
    ip,
    userAgent: ua,
  });

  const response = NextResponse.json({ ok: true });
  applySessionCookie(response, token);
  return response;
}
