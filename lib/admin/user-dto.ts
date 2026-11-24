import type { User, UserRole, Role } from "@prisma/client";

export type UserWithRoles = User & {
  userRoles: (UserRole & { role: Role })[];
};

export function toAdminUserListItem(user: UserWithRoles) {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    status: user.status,
    lastLoginAt: user.lastLoginAt,
    createdAt: user.createdAt,
    deletedAt: user.deletedAt,
    roles: user.userRoles.map((ur) => ({
      code: ur.role.code,
      name: ur.role.name,
    })),
  };
}

export function toAdminUserDetail(user: UserWithRoles) {
  return {
    ...toAdminUserListItem(user),
    updatedAt: user.updatedAt,
    emailVerifiedAt: user.emailVerifiedAt,
  };
}
