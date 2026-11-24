"use client";

import { Button, Form, Input, message } from "antd";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";

function ResetPasswordFormInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";
  const [loading, setLoading] = useState(false);

  if (!token) {
    return (
      <p className="text-center text-red-600">
        缺少重置 token，请从邮件链接进入或重新申请。
        <br />
        <Link href="/forgot-password" className="text-blue-600">
          忘记密码
        </Link>
      </p>
    );
  }

  async function onFinish(values: { password: string; confirm: string }) {
    if (values.password !== values.confirm) {
      message.error("两次密码不一致");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password: values.password }),
      });
      const data = (await res.json()) as { error?: string; message?: string };
      if (!res.ok) {
        message.error(data.error ?? "重置失败");
        return;
      }
      message.success(data.message ?? "已重置");
      router.push("/login");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Form layout="vertical" onFinish={onFinish} size="large">
      <Form.Item label="新密码" name="password" rules={[{ required: true, min: 8 }]}>
        <Input.Password autoComplete="new-password" />
      </Form.Item>
      <Form.Item label="确认密码" name="confirm" rules={[{ required: true }]}>
        <Input.Password autoComplete="new-password" />
      </Form.Item>
      <Button type="primary" htmlType="submit" block loading={loading}>
        重置密码
      </Button>
    </Form>
  );
}

export function ResetPasswordForm() {
  return (
    <Suspense fallback={<div className="h-32 animate-pulse rounded bg-zinc-100" />}>
      <ResetPasswordFormInner />
    </Suspense>
  );
}
