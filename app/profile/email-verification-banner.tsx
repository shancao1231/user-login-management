"use client";

import { Alert, Button, message } from "antd";
import { useState } from "react";

export function EmailVerificationBanner({ verified }: { verified: boolean }) {
  const [loading, setLoading] = useState(false);
  if (verified) {
    return null;
  }

  async function resend() {
    setLoading(true);
    try {
      const res = await fetch("/api/auth/resend-verification", { method: "POST" });
      const data = (await res.json()) as { error?: string; alreadyVerified?: boolean };
      if (!res.ok) {
        message.error(data.error ?? "发送失败");
        return;
      }
      if (data.alreadyVerified) {
        message.success("邮箱已验证");
        window.location.reload();
        return;
      }
      message.success("验证邮件已发送（开发环境见终端日志）");
    } catch {
      message.error("网络错误");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Alert
      type="warning"
      showIcon
      className="mb-4"
      message="邮箱尚未验证"
      description={
        <div className="mt-2 flex items-center gap-2">
          <span className="text-sm">请查收邮件或重新发送验证链接。</span>
          <Button size="small" loading={loading} onClick={() => void resend()}>
            重新发送
          </Button>
        </div>
      }
    />
  );
}