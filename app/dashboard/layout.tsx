import DashboardLayout from "@/components/DashboardLayout";
import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";

const RootLayout = async ({ children }: { children: React.ReactNode }) => {
  const session = await getSession();
  if (!session) {
    redirect("/login");
  }

  return (
    <div className="flex min-h-screen flex-col bg-white">
      <DashboardLayout user={session.user}>{children}</DashboardLayout>
    </div>
  );
};

export default RootLayout;