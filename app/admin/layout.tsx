import { getCurrentUser } from "@/lib/auth/current-user";
import { hasAnyPermission } from "@/lib/auth/permissions";
import { redirect } from "next/navigation";
import { AdminShell } from "./admin-shell";

export const dynamic = "force-dynamic";

const ADMIN_PERMISSIONS = [
  "user:read",
  "user:write",
  "role:manage",
  "audit:read",
] as const;

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login?next=/admin");
  }

  if (!hasAnyPermission(user.permissions, [...ADMIN_PERMISSIONS])) {
    return (
      <div
        className="mx-auto max-w-lg px-4 py-16 text-center"
        data-testid="admin-forbidden"
      >
        <h1 className="text-xl font-semibold">403 无权限</h1>
        <p className="mt-2 text-zinc-600">你没有管理后台访问权限。</p>
      </div>
    );
  }

  return (
    <AdminShell email={user.email} permissions={user.permissions}>
      {children}
    </AdminShell>
  );
}
