import { createPasswordResetToken } from "@/lib/auth/password-reset";
import { writeAuditLog } from "@/lib/audit";
import { prisma } from "@/lib/db";
import { sendPasswordResetEmail } from "@/lib/mail/password-reset-email";
import { getClientIp, getUserAgent } from "@/lib/http/request-meta";
import { consumeRateLimit, rateLimitKey } from "@/lib/rate-limit";
import { emailField } from "@/lib/validation/auth";
import { parseBody } from "@/lib/validation/parse";
import { z } from "zod";

const forgotPasswordBodySchema = z.object({ email: emailField });
import { NextResponse, type NextRequest } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const OK_MESSAGE = "若该邮箱已注册，将收到重置密码说明（请同时检查垃圾箱）";

export async function POST(request: NextRequest) {
  const ip = getClientIp(request);
  const ua = getUserAgent(request);

  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return NextResponse.json({ error: "无效的 JSON" }, { status: 400 });
  }

  const parsed = parseBody(forgotPasswordBodySchema, json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error, issues: parsed.issues },
      { status: 400 },
    );
  }

  const limitKey = rateLimitKey(["forgot-password", ip, parsed.data.email]);
  if (!(await consumeRateLimit(limitKey, 5, 15 * 60_000))) {
    return NextResponse.json({ error: "请求过于频繁" }, { status: 429 });
  }

  const user = await prisma.user.findFirst({
    where: {
      email: parsed.data.email,
      deletedAt: null,
      status: "ACTIVE",
    },
    select: { id: true, email: true },
  });

  if (user) {
    const { token } = await createPasswordResetToken(user.id);
    try {
      await sendPasswordResetEmail(user.email, token);
    } catch (err) {
      console.error("[forgot-password] mail error", err);
    }
    await writeAuditLog({
      actorId: user.id,
      action: "auth.forgot_password",
      targetType: "user",
      targetId: user.id,
      ip,
      userAgent: ua,
    });
  }

  return NextResponse.json({ ok: true, message: OK_MESSAGE });
}
