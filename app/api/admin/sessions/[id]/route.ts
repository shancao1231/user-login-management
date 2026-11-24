import { writeAuditLog } from "@/lib/audit";
import { requireApiPermission } from "@/lib/auth/require-api-auth";
import { prisma } from "@/lib/db";
import { getClientIp, getUserAgent } from "@/lib/http/request-meta";
import { NextResponse, type NextRequest } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

export async function DELETE(request: NextRequest, ctx: Ctx) {
  const auth = await requireApiPermission("user:write");
  if (auth instanceof NextResponse) {
    return auth;
  }

  const { id } = await ctx.params;

  const session = await prisma.session.findUnique({
    where: { id },
    select: { id: true, userId: true },
  });
  if (!session) {
    return NextResponse.json({ error: "会话不存在" }, { status: 404 });
  }

  await prisma.session.delete({ where: { id } });

  const ip = getClientIp(request);
  const ua = getUserAgent(request);
  await writeAuditLog({
    actorId: auth.user.id,
    action: "session.revoke",
    targetType: "session",
    targetId: id,
    ip,
    userAgent: ua,
    metadata: { userId: session.userId },
  });

  return NextResponse.json({ ok: true });
}
