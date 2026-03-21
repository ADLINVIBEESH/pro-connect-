import { Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { sanitizeProfileData } from "@/lib/profileCompletion";
import { DashboardTopbar } from "@/components/dashboard/DashboardTopbar";
import FreelancerSelfProfileView from "@/components/profile/FreelancerSelfProfileView";

const FreelancerProfileView = () => {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (!user?.role) return <Navigate to="/role-select" replace />;
  if (user.role !== "freelancer") return <Navigate to="/client-dashboard/profile" replace />;

  const profile = sanitizeProfileData(user.profile);

  return (
    <div className="dashboard-shell min-h-screen bg-background">
      <div className="flex min-h-screen flex-col">
        <DashboardTopbar />

        <main className="mx-auto w-full max-w-[1520px] flex-1 px-4 py-5 lg:px-8 lg:py-6">
          <FreelancerSelfProfileView
            user={user}
            profile={profile}
            onEditProfile={() => navigate("/profile-completion")}
          />
        </main>
      </div>
    </div>
  );
};

export default FreelancerProfileView;
