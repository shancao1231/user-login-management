import { AuthCard } from "../auth-card";
import { RegisterForm } from "./register-form";

export const dynamic = "force-dynamic";

export default function RegisterPage() {
  return (
    <AuthCard title="注册" subtitle="注册为普通用户（管理员由 seed 创建）">
      <RegisterForm />
    </AuthCard>
  );
}
