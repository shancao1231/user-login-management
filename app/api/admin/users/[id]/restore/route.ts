import { toAdminUserDetail } from "@/lib/admin/user-dto";
import { writeAuditLog } from "@/lib/audit";
import { requireApiPermission } from "@/lib/auth/require-api-auth";
import { prisma } from "@/lib/db";
import { getClientIp, getUserAgent } from "@/lib/http/request-meta";
import { NextResponse, type NextRequest } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

export async function POST(request: NextRequest, ctx: Ctx) {
  const auth = await requireApiPermission("user:write");
  if (auth instanceof NextResponse) {
    return auth;
  }

  const { id } = await ctx.params;

  const target = await prisma.user.findFirst({
    where: { id, deletedAt: { not: null } },
    include: { userRoles: { include: { role: true } } },
  });
  if (!target) {
    return NextResponse.json({ error: "未找到已软删用户" }, { status: 404 });
  }

  const updated = await prisma.user.update({
    where: { id },
    data: { deletedAt: null, status: "ACTIVE" },
    include: { userRoles: { include: { role: true } } },
  });

  const ip = getClientIp(request);
  const ua = getUserAgent(request);
  await writeAuditLog({
    actorId: auth.user.id,
    action: "user.restore",
    targetType: "user",
    targetId: id,
    ip,
    userAgent: ua,
  });

  return NextResponse.json({ user: toAdminUserDetail(updated) });
}