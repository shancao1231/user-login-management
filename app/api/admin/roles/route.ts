import { requireApiPermission } from "@/lib/auth/require-api-auth";
import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const auth = await requireApiPermission("role:manage");
  if (auth instanceof NextResponse) {
    return auth;
  }

  const roles = await prisma.role.findMany({
    orderBy: { code: "asc" },
    include: {
      rolePerms: {
        include: { permission: { select: { code: true, name: true } } },
      },
    },
  });

  return NextResponse.json({
    items: roles.map((r) => ({
      id: r.id,
      code: r.code,
      name: r.name,
      description: r.description,
      permissions: r.rolePerms.map((rp) => rp.permission),
    })),
  });
}