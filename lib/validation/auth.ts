import { z } from "zod";

/** 邮箱：先去空格再校验，最后统一小写，供注册/登录/forgot 共用 */
export const emailField = z
  .string()
  .trim()
  .min(1, { error: "请输入邮箱" })
  .max(255, { error: "邮箱过长" })
  .pipe(z.email({ error: "请输入有效邮箱" }))
  .transform((value: string) => value.toLowerCase());

/** 密码强度：MVP 至少 8 位，第 2 阶段注册 API 直接使用 */
export const passwordField = z
  .string()
  .min(8, { error: "密码至少 8 位" })
  .max(128, { error: "密码过长" });

export const registerBodySchema = z.object({
  email: emailField,
  password: passwordField,
  name: z.string().trim().min(1).max(100).optional(),
});

export const loginBodySchema = z.object({
  email: emailField,
  password: z.string().min(1, { error: "请输入密码" }).max(128),
});

export const forgotPasswordBodySchema = z.object({
  email: emailField,
});

export const resetPasswordBodySchema = z.object({
  token: z.string().min(10, { error: "无效的重置链接" }).max(512),
  password: passwordField,
});

export type RegisterBody = z.infer<typeof registerBodySchema>;
export type LoginBody = z.infer<typeof loginBodySchema>;
