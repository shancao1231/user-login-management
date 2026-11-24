import { prisma } from "@/lib/db";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  const [totalUsers, disabledUsers, todayLogins] = await Promise.all([
    prisma.user.count({ where: { deletedAt: null } }),
    prisma.user.count({ where: { deletedAt: null, status: "DISABLED" } }),
    prisma.user.count({
      where: {
        deletedAt: null,
        lastLoginAt: { gte: new Date(new Date().setHours(0, 0, 0, 0)) },
      },
    }),
  ]);

  return (
    <div className="space-y-6">
      <div className="rounded-lg border bg-white p-6 shadow-sm">
        <h1 className="text-xl font-semibold">概览</h1>
        <dl className="mt-4 grid gap-4 sm:grid-cols-3">
          <div>
            <dt className="text-sm text-zinc-500">用户总数</dt>
            <dd className="text-2xl font-semibold">{totalUsers}</dd>
          </div>
          <div>
            <dt className="text-sm text-zinc-500">已禁用</dt>
            <dd className="text-2xl font-semibold">{disabledUsers}</dd>
          </div>
          <div>
            <dt className="text-sm text-zinc-500">今日登录</dt>
            <dd className="text-2xl font-semibold">{todayLogins}</dd>
          </div>
        </dl>
      </div>
      <div className="rounded-lg border bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-2">
          <Link href="/admin/users" className="text-blue-600 hover:underline">
            用户管理 →
          </Link>
          <Link
            href="/admin/audit-logs"
            className="text-blue-600 hover:underline"
          >
            审计日志 →
          </Link>
        </div>
      </div>
    </div>
  );
}
