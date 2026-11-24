import { createEmailVerificationToken } from "@/lib/auth/email-verification";
import { hashPassword } from "@/lib/auth/password";
import { createSession } from "@/lib/auth/session";
import { writeAuditLog } from "@/lib/audit";
import { buildVerificationEmail } from "@/lib/mail/verification-email";
import { sendMail } from "@/lib/mail/send-mail";
import { prisma } from "@/lib/db";
import { getClientIp, getUserAgent } from "@/lib/http/request-meta";
import { applySessionCookie } from "@/lib/http/set-session-cookie";
import { consumeRateLimit, rateLimitKey } from "@/lib/rate-limit";
import { parseBody } from "@/lib/validation/parse";
import { registerBodySchema } from "@/lib/validation/auth";
import { NextResponse, type NextRequest } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const GENERIC_REGISTER_ERROR = "注册失败，请稍后重试";

export async function POST(request: NextRequest) {
  const ip = getClientIp(request);
  const limitKey = rateLimitKey(["register", ip]);
  if (!(await consumeRateLimit(limitKey, 10, 60_000))) {
    return NextResponse.json({ error: "请求过于频繁" }, { status: 429 });
  }

  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return NextResponse.json({ error: "无效的 JSON" }, { status: 400 });
  }

  const parsed = parseBody(registerBodySchema, json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error, issues: parsed.issues },
      { status: 400 },
    );
  }

  const { email, password, name } = parsed.data;

  const userRole = await prisma.role.findUnique({ where: { code: "user" } });
  if (!userRole) {
    return NextResponse.json({ error: GENERIC_REGISTER_ERROR }, { status: 500 });
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.json({ error: "该邮箱已注册" }, { status: 409 });
  }

  const passwordHash = await hashPassword(password);

  const user = await prisma.user.create({
    data: {
      email,
      passwordHash,
      name: name ?? null,
      status: "ACTIVE",
      userRoles: { create: { roleId: userRole.id } },
    },
    select: { id: true, email: true },
  });

  const { token } = await createSession({
    userId: user.id,
    ip,
    userAgent: getUserAgent(request),
  });

  const verify = await createEmailVerificationToken(user.id);
  const mail = buildVerificationEmail({ to: email, token: verify.token });
  await sendMail({ to: email, ...mail });

  await writeAuditLog({
    actorId: user.id,
    action: "auth.register",
    targetType: "user",
    targetId: user.id,
    ip,
    userAgent: getUserAgent(request),
  });

  try {
    const { token } = await createEmailVerificationToken(user.id);
    const mail = buildVerificationEmail({ to: user.email, token });
    await sendMail({ to: user.email, ...mail });
  } catch {
    /* 邮件失败不阻断注册 */
  }

  const response = NextResponse.json({
    ok: true,
    user: { id: user.id, email: user.email },
  });
  applySessionCookie(response, token);
  return response;
}
