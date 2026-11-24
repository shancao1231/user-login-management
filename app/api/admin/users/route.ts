import { toAdminUserListItem } from "@/lib/admin/user-dto";
import { requireApiPermission } from "@/lib/auth/require-api-auth";
import { prisma } from "@/lib/db";
import { adminUserListQuerySchema } from "@/lib/validation/admin";
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
  const parsed = adminUserListQuerySchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "参数错误" },
      { status: 400 },
    );
  }

  const { page, pageSize, q, status, includeDeleted } = parsed.data;
  const showDeleted = includeDeleted === "true";
  const where: Prisma.UserWhereInput = {
    ...(showDeleted ? {} : { deletedAt: null }),
    ...(status ? { status } : {}),
    ...(q
      ? {
          OR: [
            { email: { contains: q, mode: "insensitive" } },
            { name: { contains: q, mode: "insensitive" } },
          ],
        }
      : {}),
  };

  const [total, users] = await Promise.all([
    prisma.user.count({ where }),
    prisma.user.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: { userRoles: { include: { role: true } } },
    }),
  ]);

  return NextResponse.json({
    items: users.map(toAdminUserListItem),
    total,
    page,
    pageSize,
  });
}