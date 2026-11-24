import { Card } from "antd";
import { UsersTable } from "./users-table";

export const dynamic = "force-dynamic";

export default function AdminUsersPage() {
  return (
    <Card title={<span className="text-lg font-semibold">用户列表</span>}>
      <UsersTable />
    </Card>
  );
}
