import { getCurrentUser } from "@/lib/auth/current-user";
import { hasAnyPermission } from "@/lib/auth/permissions";
import Link from "next/link";
import { Suspense } from "react";
import { HomeActions } from "./home-actions";

export const dynamic = "force-dynamic";

export default async function Home() {
  const user = await getCurrentUser();

  return (
    <div className="flex flex-1 flex-col items-center justify-center bg-zinc-50 px-6 py-16">
      <main className="w-full max-w-lg rounded-xl bg-white p-10 shadow-sm">
        <p className="mb-2 text-sm text-zinc-500">方案 A · 第 2 阶段</p>
        <h1 className="mb-4 text-2xl font-semibold text-zinc-900">
          用户登录与管理后台
        </h1>
        {user ? (
          <p className="mb-6 text-zinc-600">
            已登录：<span className="font-medium">{user.email}</span>
            <span className="text-zinc-400"> · </span>
            <Link href="/profile" className="text-blue-600 hover:underline">
              个人资料
            </Link>
            {hasAnyPermission(user.permissions, [
              "user:read",
              "user:write",
              "role:manage",
              "audit:read",
            ]) ? (
              <>
                {" "}
                ·{" "}
                <Link href="/admin" className="text-blue-600 hover:underline">
                  管理后台
                </Link>
              </>
            ) : null}
          </p>
        ) : (
          <p className="mb-6 text-zinc-600">
            <Link href="/login" className="text-blue-600 hover:underline">
              登录
            </Link>
            {" · "}
            <Link href="/register" className="text-blue-600 hover:underline">
              注册
            </Link>
          </p>
        )}
        <Suspense
          fallback={<div className="h-8 w-32 animate-pulse rounded bg-zinc-100" />}
        >
          <HomeActions />
        </Suspense>
      </main>
    </div>
  );
}
