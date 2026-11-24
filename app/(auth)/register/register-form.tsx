"use client";

import { Button, Form, Input, message } from "antd";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function RegisterForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function onFinish(values: {
    email: string;
    password: string;
    confirm: string;
    name?: string;
  }) {
    if (values.password !== values.confirm) {
      message.error("两次密码不一致");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: values.email,
          password: values.password,
          name: values.name,
        }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        message.error(data.error ?? "注册失败");
        return;
      }
      message.success("注册成功");
      router.push("/profile");
      router.refresh();
    } catch {
      message.error("网络错误");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <Form layout="vertical" onFinish={onFinish} requiredMark={false} size="large">
        <Form.Item label="姓名（可选）" name="name">
          <Input autoComplete="name" />
        </Form.Item>
        <Form.Item
          label="邮箱"
          name="email"
          rules={[
            { required: true, message: "请输入邮箱" },
            { type: "email", message: "邮箱格式不正确" },
          ]}
        >
          <Input autoComplete="email" />
        </Form.Item>
        <Form.Item
          label="密码"
          name="password"
          rules={[
            { required: true, message: "请输入密码" },
            { min: 8, message: "至少 8 位" },
          ]}
        >
          <Input.Password autoComplete="new-password" />
        </Form.Item>
        <Form.Item
          label="确认密码"
          name="confirm"
          rules={[{ required: true, message: "请再次输入密码" }]}
        >
          <Input.Password autoComplete="new-password" />
        </Form.Item>
        <Button type="primary" htmlType="submit" block loading={loading}>
          注册
        </Button>
      </Form>
      <p className="mt-6 text-center text-sm text-zinc-500">
        已有账号？{" "}
        <Link href="/login" className="text-blue-600 hover:underline">
          登录
        </Link>
      </p>
    </>
  );
}
