import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import ProfileCompletionWizard from "@/pages/dashboard/ProfileCompletionWizard";

const ProfileCompletion = () => {
  const { user, isAuthenticated } = useAuth();

  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (!user?.role) return <Navigate to="/role-select" replace />;
  if (user.role !== "freelancer") return <Navigate to="/client-profile-completion" replace />;

  return <ProfileCompletionWizard />;
};

export default ProfileCompletion;
