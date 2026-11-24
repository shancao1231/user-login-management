"use client";

import { Table, Tag, message } from "antd";
import type { ColumnsType } from "antd/es/table";
import { useEffect, useState } from "react";

type RoleItem = {
  id: string;
  code: string;
  name: string;
  description: string | null;
  permissions: { code: string; name: string }[];
};

export function RolesMatrix() {
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<RoleItem[]>([]);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const res = await fetch("/api/admin/roles");
        const data = (await res.json()) as { items?: RoleItem[]; error?: string };
        if (!res.ok) {
          message.error(data.error ?? "加载失败");
          return;
        }
        setItems(data.items ?? []);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const columns: ColumnsType<RoleItem> = [
    { title: "代码", dataIndex: "code", key: "code" },
    { title: "名称", dataIndex: "name", key: "name" },
    {
      title: "权限",
      key: "permissions",
      render: (_, row) =>
        row.permissions.length ? (
          <div className="flex flex-wrap gap-1">
            {row.permissions.map((p) => (
              <Tag key={p.code}>
                {p.code} ({p.name})
              </Tag>
            ))}
          </div>
        ) : (
          "—"
        ),
    },
    {
      title: "说明",
      dataIndex: "description",
      key: "description",
      render: (v) => v ?? "—",
    },
  ];

  return (
    <Table
      rowKey="id"
      loading={loading}
      columns={columns}
      dataSource={items}
      pagination={false}
    />
  );
}