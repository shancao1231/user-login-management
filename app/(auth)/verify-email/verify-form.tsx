"use client";

import { Button, message } from "antd";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

export function VerifyEmailForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";
  const [loading, setLoading] = useState(false);

  async function submit() {
    if (!token) {
      message.error("缺少验证 token");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/auth/verify-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        message.error(data.error ?? "验证失败");
        return;
      }
      message.success("邮箱已验证");
      router.push("/profile");
      router.refresh();
    } catch {
      message.error("网络错误");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button type="primary" block loading={loading} onClick={() => void submit()}>
      确认验证邮箱
    </Button>
  );
}