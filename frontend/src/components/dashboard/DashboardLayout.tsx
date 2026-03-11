import { useAuth } from "@/contexts/AuthContext";
import { DashboardTopbar } from "@/components/dashboard/DashboardTopbar";

const DashboardLayout = ({ children }: { children: React.ReactNode }) => {
  const { user } = useAuth();

  if (!user) return null;

  return (
    <div className="dashboard-shell min-h-screen bg-background">
      <div className="flex min-h-screen flex-col">
        <DashboardTopbar />

        <main className="mx-auto flex w-full max-w-[1520px] flex-1 px-4 py-5 lg:px-8 lg:py-6">
          <div className="w-full">{children}</div>
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
