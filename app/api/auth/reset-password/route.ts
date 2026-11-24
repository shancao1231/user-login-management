import { hashPassword } from "@/lib/auth/password";
import { consumePasswordResetToken } from "@/lib/auth/password-reset";
import { revokeAllSessionsForUser } from "@/lib/auth/session";
import { writeAuditLog } from "@/lib/audit";
import { prisma } from "@/lib/db";
import { getClientIp, getUserAgent } from "@/lib/http/request-meta";
import { consumeRateLimit, rateLimitKey } from "@/lib/rate-limit";
import { passwordField } from "@/lib/validation/auth";
import { parseBody } from "@/lib/validation/parse";
import { z } from "zod";

const resetPasswordBodySchema = z.object({
  token: z.string().min(10, { error: "无效的重置链接" }).max(512),
  password: passwordField,
});
import { NextResponse, type NextRequest } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const ip = getClientIp(request);
  const ua = getUserAgent(request);

  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return NextResponse.json({ error: "无效的 JSON" }, { status: 400 });
  }

  const parsed = parseBody(resetPasswordBodySchema, json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error, issues: parsed.issues },
      { status: 400 },
    );
  }

  const limitKey = rateLimitKey(["reset-password", ip]);
  if (!(await consumeRateLimit(limitKey, 10, 60 * 60_000))) {
    return NextResponse.json({ error: "请求过于频繁" }, { status: 429 });
  }

  const consumed = await consumePasswordResetToken(parsed.data.token);
  if (!consumed) {
    return NextResponse.json({ error: "链接无效或已过期" }, { status: 400 });
  }

  const user = await prisma.user.findFirst({
    where: { id: consumed.userId, deletedAt: null, status: "ACTIVE" },
    select: { id: true },
  });
  if (!user) {
    return NextResponse.json({ error: "链接无效或已过期" }, { status: 400 });
  }

  const passwordHash = await hashPassword(parsed.data.password);
  await prisma.user.update({
    where: { id: user.id },
    data: { passwordHash },
  });
  await revokeAllSessionsForUser(user.id);

  await writeAuditLog({
    actorId: user.id,
    action: "auth.reset_password",
    targetType: "user",
    targetId: user.id,
    ip,
    userAgent: ua,
  });

  return NextResponse.json({ ok: true, message: "密码已重置，请重新登录" });
}
