import { useAuth } from "@/contexts/AuthContext";
import { DashboardTopbar } from "@/components/dashboard/DashboardTopbar";

const DashboardLayout = ({ children }: { children: React.ReactNode }) => {
  const { user } = useAuth();

  if (!user) return null;

  return (
    <div className="dashboard-shell relative min-h-screen overflow-hidden">
      {/* Subtle background orbs for depth */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="orb orb-float-slow absolute -left-48 top-0 h-[600px] w-[600px] bg-[hsl(250,50%,15%)] opacity-25" />
        <div className="orb orb-float-medium absolute -right-32 bottom-0 h-[500px] w-[500px] bg-[hsl(170,60%,15%)] opacity-20" />
      </div>

      <div className="relative flex min-h-screen flex-col">
        <DashboardTopbar />

        <main className="mx-auto flex w-full max-w-[1520px] flex-1 px-4 py-5 lg:px-8 lg:py-6">
          <div className="w-full">{children}</div>
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
