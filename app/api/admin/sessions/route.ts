import { requireApiPermission } from "@/lib/auth/require-api-auth";
import { prisma } from "@/lib/db";
import { adminSessionListQuerySchema } from "@/lib/validation/admin";
import type { Prisma } from "@prisma/client";
import { NextResponse, type NextRequest } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const auth = await requireApiPermission("user:read");
  if (auth instanceof NextResponse) {
    return auth;
  }

  const raw = Object.fromEntries(request.nextUrl.searchParams.entries());
  const parsed = adminSessionListQuerySchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "参数错误" },
      { status: 400 },
    );
  }

  const { page, pageSize, userId, q } = parsed.data;
  const where: Prisma.SessionWhereInput = {
    ...(userId ? { userId } : {}),
    ...(q
      ? {
          OR: [
            { ip: { contains: q, mode: "insensitive" } },
            { user: { email: { contains: q, mode: "insensitive" } } },
          ],
        }
      : {}),
  };

  const [total, sessions] = await Promise.all([
    prisma.session.count({ where }),
    prisma.session.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: {
        user: {
          select: { id: true, email: true, deletedAt: true, status: true },
        },
      },
    }),
  ]);

  return NextResponse.json({
    items: sessions.map((s) => ({
      id: s.id,
      userId: s.userId,
      userEmail: s.user.email,
      userStatus: s.user.status,
      ip: s.ip,
      userAgent: s.userAgent,
      expiresAt: s.expiresAt,
      createdAt: s.createdAt,
    })),
    total,
    page,
    pageSize,
  });
}