import { PrismaClient } from "@prisma/client";
import argon2 from "argon2";

const prisma = new PrismaClient();

const PERMISSIONS = [
  { code: "user:read", name: "查看用户" },
  { code: "user:write", name: "管理用户" },
  { code: "role:manage", name: "管理角色" },
  { code: "audit:read", name: "查看审计日志" },
] as const;

const ROLES = [
  {
    code: "super_admin",
    name: "超级管理员",
    description: "拥有全部权限",
    permissions: PERMISSIONS.map((p) => p.code),
  },
  {
    code: "admin",
    name: "管理员",
    description: "用户与审计管理",
    permissions: ["user:read", "user:write", "audit:read"],
  },
  {
    code: "user",
    name: "普通用户",
    description: "前台默认角色",
    permissions: [] as string[],
  },
] as const;

async function hashPassword(plain: string): Promise<string> {
  return argon2.hash(plain, { type: argon2.argon2id });
}

async function main() {
  const adminEmail =
    process.env.SEED_ADMIN_EMAIL?.toLowerCase().trim() ?? "admin@example.com";
  const adminPassword = process.env.SEED_ADMIN_PASSWORD ?? "ChangeMe_Admin123!";
  const adminName = process.env.SEED_ADMIN_NAME ?? "超级管理员";

  for (const perm of PERMISSIONS) {
    await prisma.permission.upsert({
      where: { code: perm.code },
      create: perm,
      update: { name: perm.name },
    });
  }

  const permissionByCode = Object.fromEntries(
    (await prisma.permission.findMany()).map((p) => [p.code, p.id]),
  );

  for (const roleDef of ROLES) {
    const role = await prisma.role.upsert({
      where: { code: roleDef.code },
      create: {
        code: roleDef.code,
        name: roleDef.name,
        description: roleDef.description,
      },
      update: {
        name: roleDef.name,
        description: roleDef.description,
      },
    });

    await prisma.rolePermission.deleteMany({ where: { roleId: role.id } });

    for (const code of roleDef.permissions) {
      const permissionId = permissionByCode[code];
      if (!permissionId) {
        throw new Error(`Missing permission: ${code}`);
      }
      await prisma.rolePermission.create({
        data: { roleId: role.id, permissionId },
      });
    }
  }

  const superAdminRole = await prisma.role.findUniqueOrThrow({
    where: { code: "super_admin" },
  });

  const passwordHash = await hashPassword(adminPassword);

  const adminUser = await prisma.user.upsert({
    where: { email: adminEmail },
    create: {
      email: adminEmail,
      passwordHash,
      name: adminName,
      status: "ACTIVE",
      emailVerifiedAt: new Date(),
      userRoles: {
        create: { roleId: superAdminRole.id },
      },
    },
    update: {
      name: adminName,
      passwordHash,
      status: "ACTIVE",
      emailVerifiedAt: new Date(),
    },
  });

  await prisma.userRole.upsert({
    where: {
      userId_roleId: { userId: adminUser.id, roleId: superAdminRole.id },
    },
    create: { userId: adminUser.id, roleId: superAdminRole.id },
    update: {},
  });

  console.log("Seed 完成");
  console.log(`  超级管理员邮箱: ${adminEmail}`);
  console.log(
    "  密码: 来自 SEED_ADMIN_PASSWORD 或默认 ChangeMe_Admin123!（请尽快修改）",
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
