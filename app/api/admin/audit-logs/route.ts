import { requireApiPermission } from "@/lib/auth/require-api-auth";
import { prisma } from "@/lib/db";
import type { Prisma } from "@prisma/client";
import { z } from "zod";

const adminAuditLogQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  action: z.string().trim().max(100).optional(),
  q: z.string().trim().max(200).optional(),
});
import { NextResponse, type NextRequest } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const auth = await requireApiPermission("audit:read");
  if (auth instanceof NextResponse) {
    return auth;
  }

  const raw = Object.fromEntries(request.nextUrl.searchParams.entries());
  const parsed = adminAuditLogQuerySchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "参数错误" },
      { status: 400 },
    );
  }

  const { page, pageSize, action, q } = parsed.data;

  const where: Prisma.AuditLogWhereInput = {
    ...(action ? { action: { contains: action, mode: "insensitive" } } : {}),
    ...(q
      ? {
          OR: [
            { targetId: { contains: q, mode: "insensitive" } },
            { ip: { contains: q } },
            { actor: { email: { contains: q, mode: "insensitive" } } },
          ],
        }
      : {}),
  };

  const [total, items] = await Promise.all([
    prisma.auditLog.count({ where }),
    prisma.auditLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: {
        actor: { select: { id: true, email: true } },
      },
    }),
  ]);

  return NextResponse.json({
    items: items.map((row) => ({
      id: row.id,
      action: row.action,
      actor: row.actor ? { id: row.actor.id, email: row.actor.email } : null,
      targetType: row.targetType,
      targetId: row.targetId,
      ip: row.ip,
      createdAt: row.createdAt,
    })),
    total,
    page,
    pageSize,
  });
}
