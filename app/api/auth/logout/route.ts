import { deleteSessionByToken, findSessionUserId } from "@/lib/auth/session";
import { getSessionTokenFromRequest } from "@/lib/auth/current-user";
import { writeAuditLog } from "@/lib/audit";
import { getClientIp, getUserAgent } from "@/lib/http/request-meta";
import { clearSessionCookie } from "@/lib/http/set-session-cookie";
import { NextResponse, type NextRequest } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const token = await getSessionTokenFromRequest();
  const ip = getClientIp(request);
  const ua = getUserAgent(request);

  let actorId: string | null = null;
  if (token) {
    actorId = await findSessionUserId(token);
    await deleteSessionByToken(token);
  }

  if (actorId) {
    await writeAuditLog({
      actorId,
      action: "auth.logout",
      targetType: "user",
      targetId: actorId,
      ip,
      userAgent: ua,
    });
  }

  const response = NextResponse.json({ ok: true });
  clearSessionCookie(response);
  return response;
}
