import { assertNotLastSuperAdminAfterRoleChange } from "@/lib/admin/super-admin-guard";
import { toAdminUserDetail } from "@/lib/admin/user-dto";
import { writeAuditLog } from "@/lib/audit";
import { requireApiPermission } from "@/lib/auth/require-api-auth";
import { prisma } from "@/lib/db";
import { getClientIp, getUserAgent } from "@/lib/http/request-meta";
import { parseBody } from "@/lib/validation/parse";
import { adminUserRolesPatchSchema } from "@/lib/validation/admin";
import { NextResponse, type NextRequest } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(request: NextRequest, ctx: Ctx) {
  const auth = await requireApiPermission("role:manage");
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

  const parsed = parseBody(adminUserRolesPatchSchema, json);
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

  const roles = await prisma.role.findMany({
    where: { code: { in: [...parsed.data.roleCodes] } },
  });
  if (roles.length !== parsed.data.roleCodes.length) {
    return NextResponse.json({ error: "存在无效角色" }, { status: 400 });
  }

  const guard = await assertNotLastSuperAdminAfterRoleChange({
    targetUserId: id,
    roleCodes: parsed.data.roleCodes,
  });
  if (guard) {
    return NextResponse.json({ error: guard }, { status: 400 });
  }

  await prisma.$transaction([
    prisma.userRole.deleteMany({ where: { userId: id } }),
    ...roles.map((role) =>
      prisma.userRole.create({
        data: { userId: id, roleId: role.id },
      }),
    ),
  ]);

  const updated = await prisma.user.findUniqueOrThrow({
    where: { id },
    include: { userRoles: { include: { role: true } } },
  });

  const ip = getClientIp(request);
  const ua = getUserAgent(request);
  await writeAuditLog({
    actorId: auth.user.id,
    action: "role.assign",
    targetType: "user",
    targetId: id,
    ip,
    userAgent: ua,
    metadata: { roleCodes: parsed.data.roleCodes },
  });

  return NextResponse.json({ user: toAdminUserDetail(updated) });
}
