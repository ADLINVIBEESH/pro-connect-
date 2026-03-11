import { Navigate, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { fetchReadOnlyProfileRequest } from "@/lib/userApi";
import { sanitizeClientProfileData } from "@/lib/clientProfileCompletion";
import { sanitizeProfileData } from "@/lib/profileCompletion";
import { DashboardTopbar } from "@/components/dashboard/DashboardTopbar";
import DashboardFooter from "@/components/dashboard/DashboardFooter";
import FreelancerSelfProfileView from "@/components/profile/FreelancerSelfProfileView";
import ClientSelfProfileView from "@/components/profile/ClientSelfProfileView";

const ReadOnlyProfilePage = () => {
  const { userId = "" } = useParams();
  const { isAuthenticated } = useAuth();
  const profileQuery = useQuery({
    queryKey: ["read-only-profile", userId],
    queryFn: () => fetchReadOnlyProfileRequest(userId),
    enabled: Boolean(userId),
  });

  if (!isAuthenticated) return <Navigate to="/login" replace />;

  return (
    <div className="dashboard-shell min-h-screen bg-background">
      <div className="flex min-h-screen flex-col">
        <DashboardTopbar />
        <main className="mx-auto w-full max-w-[1520px] flex-1 px-4 py-5 lg:px-8 lg:py-6">
          {profileQuery.isLoading ? <p className="py-12 text-center text-sm text-muted-foreground">Loading profile...</p> : null}

          {profileQuery.isError ? (
            <p className="py-12 text-center text-sm text-destructive">
              {profileQuery.error instanceof Error ? profileQuery.error.message : "Unable to load that profile right now."}
            </p>
          ) : null}

          {!profileQuery.isLoading && !profileQuery.isError && profileQuery.data?.role === "freelancer" ? (
            <FreelancerSelfProfileView
              user={{
                name: profileQuery.data.user.fullName,
                email: profileQuery.data.user.email,
                avatar: profileQuery.data.user.avatar ?? "",
                profile_completed: Boolean(profileQuery.data.user.freelancerProfile?.profileCompleted),
                username: profileQuery.data.user.username,
              }}
              profile={sanitizeProfileData(profileQuery.data.user.freelancerProfile?.profileData)}
              onEditProfile={() => {}}
              showEditButton={false}
            />
          ) : null}

          {!profileQuery.isLoading && !profileQuery.isError && profileQuery.data?.role === "client" ? (
            <ClientSelfProfileView
              user={{
                name: profileQuery.data.user.fullName,
                email: profileQuery.data.user.email,
                avatar: profileQuery.data.user.avatar ?? "",
                client_profile_completed: Boolean(profileQuery.data.user.clientProfile?.profileCompleted),
              }}
              profile={sanitizeClientProfileData(profileQuery.data.user.clientProfile?.profileData)}
              onEditProfile={() => {}}
              showEditButton={false}
            />
          ) : null}

          {!profileQuery.isLoading && !profileQuery.isError && !profileQuery.data?.role ? (
            <p className="py-12 text-center text-sm text-muted-foreground">Profile not found.</p>
          ) : null}
        </main>
        <div className="mx-auto w-full max-w-[1520px] px-4 pb-6 lg:px-8">
          <DashboardFooter />
        </div>
      </div>
    </div>
  );
};

export default ReadOnlyProfilePage;
