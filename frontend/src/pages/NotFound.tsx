import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";
import { motion } from "framer-motion";
import { ArrowLeft } from "lucide-react";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden px-4">
      {/* Animated background orbs */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="orb orb-float-slow orb-pulse absolute left-1/4 top-1/4 h-[400px] w-[400px] bg-[hsl(250,60%,25%)] opacity-30" />
        <div className="orb orb-float-medium absolute bottom-1/4 right-1/4 h-[350px] w-[350px] bg-[hsl(170,80%,25%)] opacity-25" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="relative text-center"
      >
        <h1 className="mb-2 text-[8rem] font-display font-bold leading-none text-gradient">404</h1>
        <p className="mb-6 text-xl font-display text-muted-foreground">Oops! Page not found</p>
        <p className="mx-auto mb-8 max-w-md text-sm text-muted-foreground/70">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <Link
          to="/"
          className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-primary to-accent px-6 py-3 text-sm font-semibold text-white shadow-sm transition-all hover:opacity-90 hover:shadow-[0_0_24px_hsl(250,60%,55%,0.3)] active:scale-[0.98]"
        >
          <ArrowLeft className="h-4 w-4" />
          Return to Home
        </Link>
      </motion.div>
    </div>
  );
};

export default NotFound;
