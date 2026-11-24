"use client";

import { Button, Form, Input, message } from "antd";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function LoginForm({ nextPath }: { nextPath?: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function onFinish(values: { email: string; password: string }) {
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        message.error(data.error ?? "登录失败");
        return;
      }
      message.success("登录成功");
      const next = nextPath?.startsWith("/") ? nextPath : "/";
      router.push(next);
      router.refresh();
    } catch {
      message.error("网络错误");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <Form
        layout="vertical"
        onFinish={onFinish}
        requiredMark={false}
        size="large"
        data-testid="auth-login-form"
      >
        <Form.Item
          label="邮箱"
          name="email"
          rules={[
            { required: true, message: "请输入邮箱" },
            { type: "email", message: "邮箱格式不正确" },
          ]}
        >
          <Input autoComplete="email" placeholder="you@example.com" />
        </Form.Item>
        <Form.Item
          label="密码"
          name="password"
          rules={[{ required: true, message: "请输入密码" }]}
        >
          <Input.Password autoComplete="current-password" />
        </Form.Item>
        <Button
          type="primary"
          htmlType="submit"
          block
          loading={loading}
          data-testid="auth-login-submit"
        >
          登录
        </Button>
      </Form>
      <p className="mt-4 text-center text-sm">
        <Link href="/forgot-password" className="text-blue-600 hover:underline">
          忘记密码？
        </Link>
      </p>
      <p className="mt-2 text-center text-sm text-zinc-500">
        没有账号？{" "}
        <Link href="/register" className="text-blue-600 hover:underline">
          注册
        </Link>
      </p>
    </>
  );
}
