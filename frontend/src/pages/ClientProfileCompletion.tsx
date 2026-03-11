import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import ClientProfileCompletionWizard from "@/pages/client-dashboard/ClientProfileCompletionWizard";

const ClientProfileCompletion = () => {
  const { user, isAuthenticated } = useAuth();

  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (!user?.role) return <Navigate to="/role-select" replace />;
  if (user.role !== "client") return <Navigate to="/profile-completion" replace />;

  return <ClientProfileCompletionWizard />;
};

export default ClientProfileCompletion;
