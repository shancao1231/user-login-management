import "server-only";

import { cookies } from "next/headers";
import { prisma } from "@/lib/db";
import { findSessionUserId, getSessionCookieName } from "@/lib/auth/session";
import { getPermissionCodesForUser, getRoleCodesForUser } from "@/lib/auth/permissions";
import type { UserStatus } from "@prisma/client";

export type CurrentUser = {
  id: string;
  email: string;
  name: string | null;
  status: UserStatus;
  emailVerifiedAt: Date | null;
  roles: string[];
  permissions: string[];
};

export async function getSessionTokenFromRequest(): Promise<string | undefined> {
  const cookieStore = await cookies();
  return cookieStore.get(getSessionCookieName())?.value;
}

export async function getCurrentUser(): Promise<CurrentUser | null> {
  const token = await getSessionTokenFromRequest();
  if (!token) {
    return null;
  }

  const userId = await findSessionUserId(token);
  if (!userId) {
    return null;
  }

  const user = await prisma.user.findFirst({
    where: { id: userId, deletedAt: null, status: "ACTIVE" },
    select: {
      id: true,
      email: true,
      name: true,
      status: true,
      emailVerifiedAt: true,
    },
  });

  if (!user) {
    return null;
  }

  const [roles, permissions] = await Promise.all([
    getRoleCodesForUser(user.id),
    getPermissionCodesForUser(user.id),
  ]);

  return { ...user, roles, permissions };
}

export async function requireCurrentUser(): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error("UNAUTHORIZED");
  }
  return user;
}
