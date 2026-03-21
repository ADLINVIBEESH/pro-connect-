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
    <div className="relative min-h-screen flex items-center justify-center px-4 overflow-hidden">
      {/* Animated background orbs */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="orb orb-float-slow orb-pulse absolute -left-40 top-1/4 h-[450px] w-[450px] bg-[hsl(250,60%,25%)] opacity-35" />
        <div className="orb orb-float-medium absolute -right-32 bottom-1/4 h-[400px] w-[400px] bg-[hsl(170,80%,25%)] opacity-30" />
        <div className="orb orb-float-fast absolute left-1/2 top-0 h-[300px] w-[300px] -translate-x-1/2 bg-[hsl(280,60%,20%)] opacity-20" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative w-full max-w-xl text-center"
      >
        <div className="flex items-center justify-center gap-2 mb-8">
          <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center glow-emerald">
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
            className="p-8 rounded-2xl glass-card border border-border hover:border-accent/50 text-left transition-all group hover:shadow-[0_0_30px_hsl(280,80%,60%,0.15)]"
          >
            <div className="w-14 h-14 rounded-xl bg-accent/15 text-accent flex items-center justify-center mb-5 group-hover:bg-accent group-hover:text-white transition-colors group-hover:shadow-[0_0_20px_hsl(280,80%,60%,0.3)]">
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
            className="p-8 rounded-2xl glass-card border border-border hover:border-secondary/50 text-left transition-all group hover:shadow-[0_0_30px_hsl(170,80%,45%,0.15)]"
          >
            <div className="w-14 h-14 rounded-xl bg-secondary/15 text-secondary flex items-center justify-center mb-5 group-hover:bg-secondary group-hover:text-white transition-colors group-hover:shadow-[0_0_20px_hsl(170,80%,45%,0.3)]">
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
