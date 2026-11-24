import { hashPassword } from "@/lib/auth/password";
import { revokeAllSessionsForUser } from "@/lib/auth/session";
import { toAdminUserDetail } from "@/lib/admin/user-dto";
import { writeAuditLog } from "@/lib/audit";
import { requireApiPermission } from "@/lib/auth/require-api-auth";
import { prisma } from "@/lib/db";
import { getClientIp, getUserAgent } from "@/lib/http/request-meta";
import { parseBody } from "@/lib/validation/parse";
import { adminResetPasswordSchema } from "@/lib/validation/admin";
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

  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return NextResponse.json({ error: "无效的 JSON" }, { status: 400 });
  }

  const parsed = parseBody(adminResetPasswordSchema, json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error, issues: parsed.issues },
      { status: 400 },
    );
  }

  const target = await prisma.user.findFirst({
    where: { id, deletedAt: null },
  });
  if (!target) {
    return NextResponse.json({ error: "用户不存在" }, { status: 404 });
  }

  const passwordHash = await hashPassword(parsed.data.password);

  const updated = await prisma.user.update({
    where: { id },
    data: { passwordHash },
    include: { userRoles: { include: { role: true } } },
  });

  await revokeAllSessionsForUser(id);

  const ip = getClientIp(request);
  const ua = getUserAgent(request);
  await writeAuditLog({
    actorId: auth.user.id,
    action: "user.reset_password",
    targetType: "user",
    targetId: id,
    ip,
    userAgent: ua,
  });

  return NextResponse.json({ user: toAdminUserDetail(updated) });
}
