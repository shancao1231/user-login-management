"use client";

import { Button, message } from "antd";
import { useState } from "react";

export function ResendVerificationButton() {
  const [loading, setLoading] = useState(false);

  async function resend() {
    setLoading(true);
    try {
      const res = await fetch("/api/auth/resend-verification", { method: "POST" });
      const data = (await res.json()) as { error?: string; message?: string };
      if (!res.ok) {
        message.error(data.error ?? "发送失败");
        return;
      }
      message.success(data.message ?? "已发送");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button type="primary" loading={loading} onClick={() => void resend()}>
      重新发送验证邮件
    </Button>
  );
}
