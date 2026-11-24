import "server-only";

import { prisma } from "@/lib/db";

export async function userHasRole(userId: string, roleCode: string): Promise<boolean> {
  const row = await prisma.userRole.findFirst({
    where: { userId, role: { code: roleCode } },
    select: { userId: true },
  });
  return !!row;
}

/** 未软删且非 DISABLED 的超级管理员数量（可排除某用户） */
export async function countActiveSuperAdmins(excludeUserId?: string): Promise<number> {
  return prisma.userRole.count({
    where: {
      role: { code: "super_admin" },
      user: {
        deletedAt: null,
        status: { not: "DISABLED" },
        ...(excludeUserId ? { id: { not: excludeUserId } } : {}),
      },
    },
  });
}

/** 禁用超级管理员或取消其 super_admin 角色前调用 */
export async function assertCanDemoteOrDisableSuperAdmin(
  targetUserId: string,
): Promise<string | null> {
  const isSuper = await userHasRole(targetUserId, "super_admin");
  if (!isSuper) {
    return null;
  }
  const others = await countActiveSuperAdmins(targetUserId);
  if (others === 0) {
    return "不能禁用或移除最后一个超级管理员";
  }
  return null;
}

export async function assertNotLastSuperAdminAfterRoleChange(params: {
  targetUserId: string;
  roleCodes: string[];
}): Promise<string | null> {
  const isSuperAfter = params.roleCodes.includes("super_admin");
  if (isSuperAfter) {
    return null;
  }
  const wasSuper = await userHasRole(params.targetUserId, "super_admin");
  if (!wasSuper) {
    return null;
  }
  const others = await countActiveSuperAdmins(params.targetUserId);
  if (others === 0) {
    return "不能移除最后一个超级管理员";
  }
  return null;
}
