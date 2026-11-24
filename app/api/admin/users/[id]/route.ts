import { assertCanDemoteOrDisableSuperAdmin } from "@/lib/admin/super-admin-guard";
import { toAdminUserDetail } from "@/lib/admin/user-dto";
import { writeAuditLog } from "@/lib/audit";
import { revokeAllSessionsForUser } from "@/lib/auth/session";
import { requireApiPermission } from "@/lib/auth/require-api-auth";
import { prisma } from "@/lib/db";
import { getClientIp, getUserAgent } from "@/lib/http/request-meta";
import { parseBody } from "@/lib/validation/parse";
import { adminUserPatchSchema } from "@/lib/validation/admin";
import { NextResponse, type NextRequest } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, ctx: Ctx) {
  const auth = await requireApiPermission("user:read");
  if (auth instanceof NextResponse) {
    return auth;
  }

  const { id } = await ctx.params;
  const user = await prisma.user.findUnique({
    where: { id },
    include: { userRoles: { include: { role: true } } },
  });

  if (!user) {
    return NextResponse.json({ error: "用户不存在" }, { status: 404 });
  }

  return NextResponse.json({ user: toAdminUserDetail(user) });
}

export async function PATCH(request: NextRequest, ctx: Ctx) {
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

  const parsed = parseBody(adminUserPatchSchema, json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error, issues: parsed.issues },
      { status: 400 },
    );
  }

  const target = await prisma.user.findFirst({
    where: { id, deletedAt: null },
    include: { userRoles: { include: { role: true } } },
  });
  if (!target) {
    return NextResponse.json({ error: "用户不存在" }, { status: 404 });
  }

  if (parsed.data.status === "DISABLED" && id === auth.user.id) {
    return NextResponse.json({ error: "不能禁用自己" }, { status: 400 });
  }

  if (parsed.data.status === "DISABLED") {
    const guard = await assertCanDemoteOrDisableSuperAdmin(id);
    if (guard) {
      return NextResponse.json({ error: guard }, { status: 400 });
    }
  }

  const updated = await prisma.user.update({
    where: { id },
    data: {
      ...(parsed.data.name !== undefined ? { name: parsed.data.name } : {}),
      ...(parsed.data.status !== undefined ? { status: parsed.data.status } : {}),
    },
    include: { userRoles: { include: { role: true } } },
  });

  if (parsed.data.status === "DISABLED") {
    await revokeAllSessionsForUser(id);
  }

  const ip = getClientIp(request);
  const ua = getUserAgent(request);
  await writeAuditLog({
    actorId: auth.user.id,
    action:
      parsed.data.status === "DISABLED"
        ? "user.disable"
        : parsed.data.status === "ACTIVE"
          ? "user.enable"
          : "user.update",
    targetType: "user",
    targetId: id,
    ip,
    userAgent: ua,
    metadata: { fields: Object.keys(parsed.data) },
  });

  return NextResponse.json({ user: toAdminUserDetail(updated) });
}

export async function DELETE(request: NextRequest, ctx: Ctx) {
  const auth = await requireApiPermission("user:write");
  if (auth instanceof NextResponse) {
    return auth;
  }

  const { id } = await ctx.params;

  if (id === auth.user.id) {
    return NextResponse.json({ error: "不能删除自己" }, { status: 400 });
  }

  const guard = await assertCanDemoteOrDisableSuperAdmin(id);
  if (guard) {
    return NextResponse.json({ error: guard }, { status: 400 });
  }

  const target = await prisma.user.findFirst({
    where: { id, deletedAt: null },
  });
  if (!target) {
    return NextResponse.json({ error: "用户不存在" }, { status: 404 });
  }

  const updated = await prisma.user.update({
    where: { id },
    data: { deletedAt: new Date(), status: "DISABLED" },
    include: { userRoles: { include: { role: true } } },
  });

  await revokeAllSessionsForUser(id);

  const ip = getClientIp(request);
  const ua = getUserAgent(request);
  await writeAuditLog({
    actorId: auth.user.id,
    action: "user.soft_delete",
    targetType: "user",
    targetId: id,
    ip,
    userAgent: ua,
  });

  return NextResponse.json({ user: toAdminUserDetail(updated) });
}