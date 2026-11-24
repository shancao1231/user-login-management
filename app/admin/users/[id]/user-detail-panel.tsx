"use client";

import { UserStatus } from "@prisma/client";
import {
  Button,
  Descriptions,
  Form,
  Input,
  Modal,
  Select,
  Space,
  Tag,
  message,
} from "antd";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

type UserDetail = {
  id: string;
  email: string;
  name: string | null;
  status: UserStatus;
  roles: { code: string; name: string }[];
  lastLoginAt: string | null;
  createdAt: string;
  deletedAt: string | null;
  emailVerifiedAt: string | null;
};

type RoleItem = { code: string; name: string };

export function UserDetailPanel({ userId }: { userId: string }) {
  const router = useRouter();
  const [user, setUser] = useState<UserDetail | null>(null);
  const [roles, setRoles] = useState<RoleItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [pwdOpen, setPwdOpen] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [userRes, rolesRes] = await Promise.all([
        fetch(`/api/admin/users/${userId}`),
        fetch("/api/admin/roles"),
      ]);
      const userData = await userRes.json();
      if (!userRes.ok) {
        message.error(userData.error ?? "加载失败");
        return;
      }
      setUser(userData.user);
      if (rolesRes.ok) {
        const rolesData = await rolesRes.json();
        setRoles(rolesData.items ?? []);
      }
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    void load();
  }, [load]);

  async function patchStatus(next: UserStatus) {
    Modal.confirm({
      title: next === "DISABLED" ? "禁用用户" : "启用用户",
      content: "确定继续？禁用后将立即撤销其所有会话。",
      onOk: async () => {
        const res = await fetch(`/api/admin/users/${userId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: next }),
        });
        const data = await res.json();
        if (!res.ok) {
          message.error(data.error ?? "操作失败");
          return;
        }
        message.success("已更新");
        setUser(data.user);
      },
    });
  }

  async function saveName(name: string) {
    const res = await fetch(`/api/admin/users/${userId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });
    const data = await res.json();
    if (!res.ok) {
      message.error(data.error ?? "保存失败");
      return;
    }
    message.success("已保存");
    setUser(data.user);
  }

  async function saveRoles(roleCodes: string[]) {
    const res = await fetch(`/api/admin/users/${userId}/roles`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ roleCodes }),
    });
    const data = await res.json();
    if (!res.ok) {
      message.error(data.error ?? "分配失败");
      return;
    }
    message.success("角色已更新");
    setUser(data.user);
  }

  async function softDelete() {
    Modal.confirm({
      title: "软删除用户",
      content: "用户将从列表隐藏且无法登录，邮箱仍被占用。可日后恢复。",
      okType: "danger",
      onOk: async () => {
        const res = await fetch(`/api/admin/users/${userId}`, { method: "DELETE" });
        const data = await res.json();
        if (!res.ok) {
          message.error(data.error ?? "删除失败");
          return;
        }
        message.success("已软删除");
        setUser(data.user);
      },
    });
  }

  async function restore() {
    const res = await fetch(`/api/admin/users/${userId}/restore`, { method: "POST" });
    const data = await res.json();
    if (!res.ok) {
      message.error(data.error ?? "恢复失败");
      return;
    }
    message.success("已恢复");
    setUser(data.user);
  }

  async function resetPassword(password: string) {
    const res = await fetch(`/api/admin/users/${userId}/reset-password`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });
    const data = await res.json();
    if (!res.ok) {
      message.error(data.error ?? "重置失败");
      return;
    }
    message.success("密码已重置，该用户所有会话已失效");
    setPwdOpen(false);
    setUser(data.user);
  }

  if (loading || !user) {
    return <div className="h-48 animate-pulse rounded bg-zinc-100" />;
  }

  return (
    <div className="space-y-6">
      <Descriptions bordered column={1} size="small" title="基本信息">
        <Descriptions.Item label="邮箱">{user.email}</Descriptions.Item>
        <Descriptions.Item label="姓名">{user.name ?? "—"}</Descriptions.Item>
        <Descriptions.Item label="状态">
          <Tag color={user.status === "ACTIVE" ? "green" : "red"}>{user.status}</Tag>
          {user.deletedAt ? <Tag className="ml-2">软删于 {new Date(user.deletedAt).toLocaleString()}</Tag> : null}
        </Descriptions.Item>
        <Descriptions.Item label="邮箱验证">
          {user.emailVerifiedAt ? (
            <Tag color="green">已验证</Tag>
          ) : (
            <Tag color="gold">未验证</Tag>
          )}
        </Descriptions.Item>
        <Descriptions.Item label="角色">
          {user.roles.map((r) => r.code).join(", ")}
        </Descriptions.Item>
      </Descriptions>

      <Space wrap>
        {user.deletedAt ? (
          <Button type="primary" onClick={() => void restore()}>
            恢复用户
          </Button>
        ) : (
          <>
            {user.status === "ACTIVE" ? (
              <Button danger onClick={() => patchStatus("DISABLED")}>
                禁用
              </Button>
            ) : (
              <Button type="primary" onClick={() => patchStatus("ACTIVE")}>
                启用
              </Button>
            )}
            <Button danger onClick={() => softDelete()}>
              软删除
            </Button>
            <Button onClick={() => setPwdOpen(true)}>重置密码</Button>
          </>
        )}
        <Button onClick={() => router.push("/admin/users")}>返回列表</Button>
      </Space>

      <Form
        layout="inline"
        initialValues={{ name: user.name ?? "" }}
        key={user.name}
        onFinish={(v) => saveName(v.name)}
      >
        <Form.Item name="name" label="修改姓名" rules={[{ required: true }]}>
          <Input style={{ width: 200 }} />
        </Form.Item>
        <Button type="primary" htmlType="submit">
          保存
        </Button>
      </Form>

      <Form
        layout="vertical"
        initialValues={{ roleCodes: user.roles.map((r) => r.code) }}
        key={user.roles.map((r) => r.code).join(",")}
        onFinish={(v) => saveRoles(v.roleCodes)}
        style={{ maxWidth: 400 }}
      >
        <Form.Item name="roleCodes" label="分配角色">
          <Select
            mode="multiple"
            options={roles.map((r) => ({
              value: r.code,
              label: `${r.name} (${r.code})`,
            }))}
          />
        </Form.Item>
        <Button type="primary" htmlType="submit">
          更新角色
        </Button>
      </Form>

      <Modal
        title="管理员重置密码"
        open={pwdOpen}
        footer={null}
        onCancel={() => setPwdOpen(false)}
        destroyOnClose
      >
        <Form layout="vertical" onFinish={(v) => resetPassword(v.password)}>
          <Form.Item
            name="password"
            label="新密码"
            rules={[{ required: true, min: 8 }]}
          >
            <Input.Password />
          </Form.Item>
          <Button type="primary" htmlType="submit" block>
            确认重置
          </Button>
        </Form>
      </Modal>
    </div>
  );
}
