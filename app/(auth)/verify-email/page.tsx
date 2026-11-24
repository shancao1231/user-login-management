import { Suspense } from "react";
import { VerifyEmailForm } from "./verify-form";

export const dynamic = "force-dynamic";

export default function VerifyEmailPage() {
  return (
    <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-4 py-16">
      <div className="rounded-xl bg-white p-8 shadow-sm">
        <h1 className="text-xl font-semibold">邮箱验证</h1>
        <p className="mt-2 text-sm text-zinc-600">点击下方按钮完成验证。</p>
        <div className="mt-6">
          <Suspense
            fallback={<div className="h-10 animate-pulse rounded bg-zinc-100" />}
          >
            <VerifyEmailForm />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
