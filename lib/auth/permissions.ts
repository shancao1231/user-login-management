import "server-only";

import { prisma } from "@/lib/db";

export async function getRoleCodesForUser(userId: string): Promise<string[]> {
  const rows = await prisma.userRole.findMany({
    where: { userId },
    select: { role: { select: { code: true } } },
  });
  return rows.map((r) => r.role.code);
}

export async function getPermissionCodesForUser(userId: string): Promise<string[]> {
  const rows = await prisma.userRole.findMany({
    where: { userId },
    select: {
      role: {
        select: {
          rolePerms: { select: { permission: { select: { code: true } } } },
        },
      },
    },
  });

  const codes = new Set<string>();
  for (const row of rows) {
    for (const rp of row.role.rolePerms) {
      codes.add(rp.permission.code);
    }
  }
  return [...codes].sort();
}

export function hasPermission(permissions: string[], code: string): boolean {
  return permissions.includes(code);
}

export function hasAnyPermission(permissions: string[], codes: string[]): boolean {
  return codes.some((c) => permissions.includes(c));
}
