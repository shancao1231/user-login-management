import type { ZodType } from "zod";

export type ParseResult<T> =
  | { success: true; data: T }
  | { success: false; error: string; issues: { path: string; message: string }[] };

export function parseBody<T>(schema: ZodType<T>, input: unknown): ParseResult<T> {
  const result = schema.safeParse(input);
  if (result.success) {
    return { success: true, data: result.data };
  }
  const issues = result.error.issues.map((issue) => ({
    path: issue.path.join(".") || "_",
    message: issue.message,
  }));
  return {
    success: false,
    error: issues[0]?.message ?? "参数校验失败",
    issues,
  };
}
