import { AuthCard } from "../auth-card";
import { LoginForm } from "./login-form";
import { Suspense } from "react";

export const dynamic = "force-dynamic";

export default function LoginPage() {
  return (
    <AuthCard title="登录" subtitle="使用邮箱与密码登录">
      <Suspense fallback={<div className="h-40 animate-pulse rounded bg-zinc-100" />}>
        <LoginForm />
      </Suspense>
    </AuthCard>
  );
}
