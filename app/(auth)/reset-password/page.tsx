import { AuthCard } from "../auth-card";
import { ResetPasswordForm } from "./reset-form";

export const dynamic = "force-dynamic";

export default function ResetPasswordPage() {
  return (
    <AuthCard title="重置密码" subtitle="设置新的登录密码（链接 30 分钟内有效）">
      <ResetPasswordForm />
    </AuthCard>
  );
}
