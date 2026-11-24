import { createEmailVerificationToken } from "@/lib/auth/email-verification";
import { requireApiAuth } from "@/lib/auth/require-api-auth";
import { writeAuditLog } from "@/lib/audit";
import { prisma } from "@/lib/db";
import { getClientIp, getUserAgent } from "@/lib/http/request-meta";
import { buildVerificationEmail } from "@/lib/mail/verification-email";
import { sendMail } from "@/lib/mail/send-mail";
import { consumeRateLimit, rateLimitKey } from "@/lib/rate-limit";
import { NextResponse, type NextRequest } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const auth = await requireApiAuth();
  if (auth instanceof NextResponse) {
    return auth;
  }

  const ip = getClientIp(request);
  const ua = getUserAgent(request);
  const limitKey = rateLimitKey(["resend-verify", auth.user.id, ip]);
  if (!(await consumeRateLimit(limitKey, 3, 15 * 60_000))) {
    return NextResponse.json({ error: "请求过于频繁，请稍后再试" }, { status: 429 });
  }

  const row = await prisma.user.findFirst({
    where: { id: auth.user.id, deletedAt: null },
    select: { id: true, email: true, emailVerifiedAt: true },
  });
  if (!row) {
    return NextResponse.json({ error: "用户不存在" }, { status: 404 });
  }
  if (row.emailVerifiedAt) {
    return NextResponse.json({ ok: true, alreadyVerified: true });
  }

  const { token } = await createEmailVerificationToken(row.id);
  const mail = buildVerificationEmail({ to: row.email, token });
  await sendMail({ to: row.email, ...mail });

  await writeAuditLog({
    actorId: row.id,
    action: "auth.verification_resent",
    targetType: "user",
    targetId: row.id,
    ip,
    userAgent: ua,
  });

  return NextResponse.json({ ok: true });
}
