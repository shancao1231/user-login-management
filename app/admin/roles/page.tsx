import { Card } from "antd";
import { RolesMatrix } from "./roles-matrix";

export const dynamic = "force-dynamic";

export default function AdminRolesPage() {
  return (
    <Card
      title={<span className="text-lg font-semibold">角色与权限</span>}
      extra={<span className="text-sm text-zinc-500">只读视图（编辑见后续 6.8）</span>}
    >
      <RolesMatrix />
    </Card>
  );
}