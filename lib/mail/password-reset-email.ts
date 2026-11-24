import "server-only";

import { getAppBaseUrl, sendMail } from "@/lib/mail/send-mail";

export async function sendPasswordResetEmail(
  email: string,
  token: string,
): Promise<void> {
  const base = getAppBaseUrl().replace(/\/$/, "");
  const link = `${base}/reset-password?token=${encodeURIComponent(token)}`;

  await sendMail({
    to: email,
    subject: "重置您的密码",
    text: `请在 30 分钟内打开链接重置密码：\n${link}\n\n如非本人操作请忽略。`,
    html: `
      <p>您申请了重置密码。</p>
      <p><a href="${link}">点击此处重置密码</a>（30 分钟内有效）</p>
      <p style="color:#666;font-size:12px">如非本人操作请忽略。</p>
    `,
  });
}
