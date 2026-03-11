import { Navigate, Routes, Route, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { DashboardFilterProvider } from "@/contexts/DashboardFilterContext";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import DashboardHome from "@/pages/dashboard/DashboardHome";
import FindWork from "@/pages/dashboard/FindWork";
import FindTalent from "@/pages/dashboard/FindTalent";
import MyJobs from "@/pages/dashboard/MyJobs";
import PostJob from "@/pages/dashboard/PostJob";
import JobDetail from "@/pages/dashboard/JobDetail";
import MyApplications from "@/pages/dashboard/MyApplications";
import SavedJobs from "@/pages/dashboard/SavedJobs";
import FreelancerProfile from "@/pages/dashboard/FreelancerProfile";
import Profile from "@/pages/dashboard/Profile";
import ContractsPlaceholder from "@/pages/dashboard/ContractsPlaceholder";
import MessagesPlaceholder from "@/pages/dashboard/MessagesPlaceholder";
import SettingsPlaceholder from "@/pages/dashboard/SettingsPlaceholder";

const Dashboard = () => {
  const { user, isAuthenticated } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (!user?.role) return <Navigate to="/role-select" replace />;

  if (user.role === "client" && location.pathname.startsWith("/dashboard")) {
    return <Navigate to={location.pathname.replace(/^\/dashboard/, "/client-dashboard")} replace />;
  }

  if (user.role === "freelancer" && location.pathname.startsWith("/client-dashboard")) {
    return <Navigate to={location.pathname.replace(/^\/client-dashboard/, "/dashboard")} replace />;
  }

  const dashboardBasePath = user.role === "client" ? "/client-dashboard" : "/dashboard";
  const isIncompleteFreelancer = user.role === "freelancer" && !user.profile_completed;
  const blockedPrefixes = [
    `${dashboardBasePath}/find-work`,
    `${dashboardBasePath}/applications`,
    `${dashboardBasePath}/saved`,
    `${dashboardBasePath}/job/`,
    `${dashboardBasePath}/freelancer/`,
  ];

  const blockedPath = blockedPrefixes.some((prefix) => location.pathname.startsWith(prefix));
  if (isIncompleteFreelancer && blockedPath) {
    return <Navigate to={dashboardBasePath} replace />;
  }

  return (
    <DashboardFilterProvider>
      <DashboardLayout>
        <Routes>
          <Route index element={<DashboardHome />} />
          <Route path="find-work" element={<FindWork />} />
          <Route path="talent" element={<FindTalent />} />
          <Route path="my-jobs" element={<MyJobs />} />
          <Route path="post-job" element={<PostJob />} />
          <Route path="job/:id" element={<JobDetail />} />
          <Route path="applications" element={<MyApplications />} />
          <Route path="saved" element={<SavedJobs />} />
          <Route path="contracts" element={<ContractsPlaceholder />} />
          <Route path="messages" element={<MessagesPlaceholder />} />
          <Route path="settings" element={<SettingsPlaceholder />} />
          <Route path="freelancer/:id" element={<FreelancerProfile />} />
          <Route path="profile" element={<Profile />} />
          <Route
            path="profile-completion"
            element={<Navigate to={user.role === "client" ? "/client-profile-completion" : "/profile-completion"} replace />}
          />
        </Routes>
      </DashboardLayout>
    </DashboardFilterProvider>
  );
};

export default Dashboard;
