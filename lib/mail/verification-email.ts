import "server-only";

import { getAppBaseUrl } from "@/lib/mail/send-mail";

export function buildVerificationEmail(params: {
  to: string;
  token: string;
}): { subject: string; html: string; text: string } {
  const link = `${getAppBaseUrl()}/verify-email?token=${encodeURIComponent(params.token)}`;
  const subject = "验证你的邮箱";
  const text = `请点击链接完成邮箱验证（24 小时内有效）：\n${link}`;
  const html = `<p>请点击链接完成邮箱验证（24 小时内有效）：</p><p><a href="${link}">${link}</a></p>`;
  return { subject, html, text };
}