import { UserStatus } from "@prisma/client";
import { z } from "zod";
import { passwordField } from "@/lib/validation/auth";

export const adminUserListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  q: z.string().trim().max(200).optional(),
  status: z.nativeEnum(UserStatus).optional(),
  includeDeleted: z.enum(["true", "false"]).optional(),
});

export const adminSessionListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  userId: z.string().min(1).optional(),
  q: z.string().trim().max(200).optional(),
});

export const adminUserPatchSchema = z
  .object({
    name: z.string().trim().min(1).max(100).optional(),
    status: z.nativeEnum(UserStatus).optional(),
  })
  .refine((v) => v.name !== undefined || v.status !== undefined, {
    message: "至少需要更新 name 或 status",
  });

export const adminUserRolesPatchSchema = z.object({
  roleCodes: z.array(z.string().min(1)).min(1).max(10),
});

export const adminResetPasswordSchema = z.object({
  password: passwordField,
});

export type AdminUserListQuery = z.infer<typeof adminUserListQuerySchema>;

export const adminAuditLogQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  action: z.string().trim().max(100).optional(),
  q: z.string().trim().max(200).optional(),
});

export type AdminAuditLogQuery = z.infer<typeof adminAuditLogQuerySchema>;
