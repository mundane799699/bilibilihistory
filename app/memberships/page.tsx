import MembershipsManager from "@/components/MembershipsManager";

export default function MembershipsPage() {
  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">会员管理</h1>
        <p className="text-muted-foreground">在这里管理您的所有会员。</p>
      </div>

      <MembershipsManager />
    </div>
  );
}
