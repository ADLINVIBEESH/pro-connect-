import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import ClientSelfProfileView from "@/components/profile/ClientSelfProfileView";
import { sanitizeClientProfileData } from "@/lib/clientProfileCompletion";

const Profile = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  if (!user) return null;
  if (user.role === "freelancer") return <Navigate to="/profile" replace />;

  const profile = sanitizeClientProfileData(user.client_profile);
  const profileCompletionPath = location.pathname.startsWith("/client-dashboard")
    ? "/client-profile-completion"
    : "/client-profile-completion";

  return (
    <ClientSelfProfileView
      user={user}
      profile={profile}
      onEditProfile={() => navigate(profileCompletionPath)}
    />
  );
};

export default Profile;
