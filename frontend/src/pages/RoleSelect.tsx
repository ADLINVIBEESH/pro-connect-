import { useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Briefcase, Code, Zap } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";

const RoleSelect = () => {
  const [isSaving, setIsSaving] = useState(false);
  const { isAuthenticated, user, setRole } = useAuth();
  const navigate = useNavigate();

  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (user?.role) return <Navigate to={user.role === "client" ? "/client-dashboard" : "/dashboard"} replace />;

  const handleSelect = async (role: "client" | "freelancer") => {
    if (isSaving) return;

    setIsSaving(true);

    try {
      const sessionUser = await setRole(role);
      navigate(sessionUser.role === "client" ? "/client-dashboard" : "/dashboard");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to save your role right now.";
      toast.error(message);
      setIsSaving(false);
      return;
    }

    setIsSaving(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/50 px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-xl text-center"
      >
        <div className="flex items-center justify-center gap-2 mb-8">
          <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center">
            <Zap className="w-5 h-5 text-secondary-foreground" />
          </div>
          <span className="text-2xl font-display font-bold text-foreground">ProConnect</span>
        </div>

        <h1 className="text-3xl md:text-4xl font-display font-bold text-foreground mb-3">
          How will you use ProConnect?
        </h1>
        <p className="text-muted-foreground mb-10">Choose your primary role. You can always change this later.</p>

        <div className="grid md:grid-cols-2 gap-5">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => void handleSelect("client")}
            disabled={isSaving}
            className="p-8 rounded-2xl bg-card card-shadow border-2 border-border hover:border-accent text-left transition-colors group"
          >
            <div className="w-14 h-14 rounded-xl bg-accent/10 text-accent flex items-center justify-center mb-5 group-hover:bg-accent group-hover:text-accent-foreground transition-colors">
              <Briefcase className="w-7 h-7" />
            </div>
            <h3 className="text-xl font-display font-semibold text-foreground mb-2">I want to Hire</h3>
            <p className="text-sm text-muted-foreground">Find and connect with skilled freelancers for your projects.</p>
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => void handleSelect("freelancer")}
            disabled={isSaving}
            className="p-8 rounded-2xl bg-card card-shadow border-2 border-border hover:border-secondary text-left transition-colors group"
          >
            <div className="w-14 h-14 rounded-xl bg-secondary/10 text-secondary flex items-center justify-center mb-5 group-hover:bg-secondary group-hover:text-secondary-foreground transition-colors">
              <Code className="w-7 h-7" />
            </div>
            <h3 className="text-xl font-display font-semibold text-foreground mb-2">I want to Work</h3>
            <p className="text-sm text-muted-foreground">Browse opportunities and get hired by top companies worldwide.</p>
          </motion.button>
        </div>
      </motion.div>
    </div>
  );
};

export default RoleSelect;
