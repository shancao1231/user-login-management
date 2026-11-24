import { getCurrentUser } from "@/lib/auth/current-user";
import { hasAnyPermission } from "@/lib/auth/permissions";
import Link from "next/link";
import { redirect } from "next/navigation";
import { LogoutButton } from "./logout-button";
import { EmailVerificationBanner } from "./email-verification-banner";
import { ResendVerificationButton } from "./resend-verification-button";

export const dynamic = "force-dynamic";

export default async function ProfilePage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login?next=/profile");
  }

  const canAdmin = hasAnyPermission(user.permissions, [
    "user:read",
    "user:write",
    "role:manage",
    "audit:read",
  ]);

  return (
    <div className="mx-auto flex w-full max-w-lg flex-1 flex-col gap-6 px-4 py-12">
      <div className="rounded-xl bg-white p-8 shadow-sm">
        <EmailVerificationBanner verified={!!user.emailVerifiedAt} />
        <h1 className="text-2xl font-semibold">个人资料</h1>
        {!user.emailVerifiedAt ? (
          <div className="mt-4 rounded border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            <p>你的邮箱尚未验证。请查收注册邮件，或在下方重新发送。</p>
            <div className="mt-3">
              <ResendVerificationButton />
            </div>
          </div>
        ) : null}
        <dl className="mt-6 space-y-3 text-sm">
          <div>
            <dt className="text-zinc-500">邮箱</dt>
            <dd className="font-medium">
              {user.email}
              {user.emailVerifiedAt ? (
                <span className="ml-2 text-xs text-green-600">已验证</span>
              ) : (
                <span className="ml-2 text-xs text-amber-600">未验证</span>
              )}
            </dd>
          </div>
          <div>
            <dt className="text-zinc-500">姓名</dt>
            <dd className="font-medium">{user.name ?? "—"}</dd>
          </div>
          <div>
            <dt className="text-zinc-500">角色</dt>
            <dd className="font-medium">{user.roles.join(", ") || "—"}</dd>
          </div>
        </dl>
        <div className="mt-8 flex flex-wrap gap-3">
          <LogoutButton />
          {canAdmin ? (
            <Link
              href="/admin"
              className="inline-flex h-8 items-center rounded border border-zinc-200 px-4 text-sm hover:bg-zinc-50"
            >
              管理后台
            </Link>
          ) : null}
        </div>
      </div>
    </div>
  );
}
