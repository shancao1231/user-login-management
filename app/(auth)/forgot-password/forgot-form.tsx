"use client";

import { Button, Form, Input, message } from "antd";
import Link from "next/link";
import { useState } from "react";

export function ForgotPasswordForm() {
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  async function onFinish(values: { email: string }) {
    setLoading(true);
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      const data = (await res.json()) as { message?: string; error?: string };
      if (!res.ok) {
        message.error(data.error ?? "提交失败");
        return;
      }
      message.success(data.message ?? "已提交");
      setSent(true);
    } finally {
      setLoading(false);
    }
  }

  if (sent) {
    return (
      <p className="text-center text-zinc-600">
        若邮箱存在，请查收邮件；开发环境请查看终端{" "}
        <code className="text-xs">[mail:dev]</code> 日志。
        <br />
        <Link href="/login" className="mt-4 inline-block text-blue-600">
          返回登录
        </Link>
      </p>
    );
  }

  return (
    <>
      <Form layout="vertical" onFinish={onFinish} size="large">
        <Form.Item
          label="注册邮箱"
          name="email"
          rules={[{ required: true, type: "email" }]}
        >
          <Input autoComplete="email" />
        </Form.Item>
        <Button type="primary" htmlType="submit" block loading={loading}>
          发送重置说明
        </Button>
      </Form>
      <p className="mt-6 text-center text-sm">
        <Link href="/login" className="text-blue-600">
          返回登录
        </Link>
      </p>
    </>
  );
}
