import "server-only";

import { getCurrentUser, type CurrentUser } from "@/lib/auth/current-user";
import { NextResponse } from "next/server";
import { hasPermission } from "@/lib/auth/permissions";

export async function requireApiAuth(): Promise<{ user: CurrentUser } | NextResponse> {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "未登录" }, { status: 401 });
  }
  return { user };
}

export async function requireApiPermission(
  permission: string,
): Promise<{ user: CurrentUser } | NextResponse> {
  const auth = await requireApiAuth();
  if (auth instanceof NextResponse) {
    return auth;
  }
  if (!hasPermission(auth.user.permissions, permission)) {
    return NextResponse.json({ error: "无权限" }, { status: 403 });
  }
  return auth;
}
