import { Card } from "antd";
import { UserDetailPanel } from "./user-detail-panel";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ id: string }> };

export default async function AdminUserDetailPage({ params }: Props) {
  const { id } = await params;
  return (
    <Card title={<span className="text-lg font-semibold">用户详情</span>}>
      <UserDetailPanel userId={id} />
    </Card>
  );
}
