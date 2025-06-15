import Header from "@/components/Header";
import DashboardLayout from "@/components/DashboardLayout";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { headers } from "next/headers";

const RootLayout = async ({ children }: { children: React.ReactNode }) => {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  if (!session) {
    redirect("/login");
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header user={session.user} />
      <DashboardLayout>{children}</DashboardLayout>
    </div>
  );
};

export default RootLayout;
