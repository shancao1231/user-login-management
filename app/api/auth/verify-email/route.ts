import { consumeEmailVerificationToken } from "@/lib/auth/email-verification";
import { writeAuditLog } from "@/lib/audit";
import { getClientIp, getUserAgent } from "@/lib/http/request-meta";
import { consumeRateLimit, rateLimitKey } from "@/lib/rate-limit";
import { parseBody } from "@/lib/validation/parse";
import { z } from "zod";
import { NextResponse, type NextRequest } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const bodySchema = z.object({
  token: z.string().min(10).max(512),
});

export async function POST(request: NextRequest) {
  const ip = getClientIp(request);
  const ua = getUserAgent(request);

  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return NextResponse.json({ error: "无效的 JSON" }, { status: 400 });
  }

  const parsed = parseBody(bodySchema, json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error, issues: parsed.issues },
      { status: 400 },
    );
  }

  const limitKey = rateLimitKey(["verify-email", ip]);
  if (!(await consumeRateLimit(limitKey, 20, 15 * 60_000))) {
    return NextResponse.json({ error: "请求过于频繁" }, { status: 429 });
  }

  const consumed = await consumeEmailVerificationToken(parsed.data.token);
  if (!consumed) {
    return NextResponse.json({ error: "链接无效或已过期" }, { status: 400 });
  }

  await writeAuditLog({
    actorId: consumed.userId,
    action: "auth.email_verified",
    targetType: "user",
    targetId: consumed.userId,
    ip,
    userAgent: ua,
  });

  return NextResponse.json({ ok: true });
}
