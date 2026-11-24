import "server-only";

import { log } from "@/lib/log";

export type SendMailInput = {
  to: string;
  subject: string;
  html: string;
  text?: string;
};

export async function sendMail(input: SendMailInput): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.MAIL_FROM;

  if (apiKey && from) {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to: input.to,
        subject: input.subject,
        html: input.html,
        text: input.text,
      }),
    });
    if (!res.ok) {
      const body = await res.text();
      throw new Error(`Resend 发送失败: ${res.status} ${body}`);
    }
    return;
  }

  log.info(
    {
      mailDev: true,
      to: input.to,
      subject: input.subject,
      body: input.text ?? input.html,
    },
    "[mail:dev] 未配置 RESEND，邮件内容输出到日志",
  );
}

export function getAppBaseUrl(): string {
  return (
    process.env.APP_URL ?? process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"
  );
}
