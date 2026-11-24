import { AuthCard } from "../auth-card";
import { LoginForm } from "./login-form";

export const dynamic = "force-dynamic";

type Props = {
  searchParams: Promise<{ next?: string }>;
};

export default async function LoginPage({ searchParams }: Props) {
  const { next } = await searchParams;
  return (
    <AuthCard title="登录" subtitle="使用邮箱与密码登录">
      <LoginForm nextPath={next} />
    </AuthCard>
  );
}
