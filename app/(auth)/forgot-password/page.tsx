import { AuthCard } from "../auth-card";
import { ForgotPasswordForm } from "./forgot-form";

export const dynamic = "force-dynamic";

export default function ForgotPasswordPage() {
  return (
    <AuthCard title="忘记密码" subtitle="输入邮箱，我们将发送重置链接">
      <ForgotPasswordForm />
    </AuthCard>
  );
}
