import { motion } from "framer-motion";
import { FileText } from "lucide-react";
import { Link } from "react-router-dom";

const ContractsPlaceholder = () => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className="flex min-h-[46vh] flex-col items-center justify-center text-center"
    >
      <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-[4px] border border-border bg-card">
        <FileText className="h-6 w-6 text-muted-foreground" />
      </div>
      <h1 className="mb-1 text-xl font-display font-semibold text-foreground">Ongoing Works</h1>
      <p className="mb-4 max-w-md text-sm text-muted-foreground">
        Active contracts and milestones will appear here soon.
      </p>
      <Link to="/dashboard" className="dashboard-btn-primary">
        Back to Dashboard
      </Link>
    </motion.div>
  );
};

export default ContractsPlaceholder;
