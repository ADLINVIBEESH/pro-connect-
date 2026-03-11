import { Navigate, useParams } from "react-router-dom";

const FreelancerProfile = () => {
  const { id } = useParams();

  if (!id) {
    return <p className="py-12 text-center text-sm text-muted-foreground">Profile not found.</p>;
  }

  return <Navigate to={`/profile/${id}`} replace />;
};

export default FreelancerProfile;
