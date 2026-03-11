import { motion } from "framer-motion";
import { MessageSquareText } from "lucide-react";

const MessagesPlaceholder = () => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.22, ease: "easeOut" }}
      className="rounded-[12px] border border-border bg-card p-6 shadow-[0_18px_40px_-32px_rgba(0,0,0,0.58)]"
    >
      <div className="flex h-12 w-12 items-center justify-center rounded-[12px] bg-accent/15 text-accent">
        <MessageSquareText className="h-5 w-5" />
      </div>
      <h1 className="mt-5 text-[1.8rem] font-display font-semibold text-foreground">Messages</h1>
      <p className="mt-3 max-w-2xl text-[15px] leading-7 text-muted-foreground">
        Your freelancer conversations and client replies will appear here in the updated dashboard experience.
      </p>
    </motion.div>
  );
};

export default MessagesPlaceholder;
