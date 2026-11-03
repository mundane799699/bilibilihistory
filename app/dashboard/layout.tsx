import DashboardLayout from "@/components/DashboardLayout";
import { getSession } from "@/lib/session";
import { reconcileUserOrders } from "@/lib/pay/service";
import { redirect } from "next/navigation";

const RootLayout = async ({ children }: { children: React.ReactNode }) => {
  const session = await getSession();
  if (!session) {
    redirect("/login");
  }

  // 蓝兔回调送不到本站，靠进站时主动对账补开会员（失败不影响页面）
  await reconcileUserOrders(session.user.id).catch(() => {});

  return (
    <div className="flex min-h-screen flex-col bg-white">
      <DashboardLayout user={session.user}>{children}</DashboardLayout>
    </div>
  );
};

export default RootLayout;