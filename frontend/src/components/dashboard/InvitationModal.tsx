import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Notification, notifyUserRequest } from "@/lib/userApi";
import { findOrCreateConversationRequest } from "@/lib/chatApi";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ExternalLink, User, Loader2, CheckCircle2, XCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Badge } from "@/components/ui/badge";

interface InvitationModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  notification: Notification | null;
  dashboardBasePath: string;
}

export const InvitationModal = ({ isOpen, onOpenChange, notification, dashboardBasePath }: InvitationModalProps) => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const respondMutation = useMutation({
    mutationFn: (data: { status: "accept" | "reject" }) => {
      if (!notification || !notification.jobId) throw new Error("Invalid invitation");
      
      const message = data.status === "accept" 
        ? `Freelancer accepted your job invite for ${notification.jobId.title}!` 
        : `Freelancer rejected your job invite for ${notification.jobId.title}.`;
        
      const type = data.status === "accept" ? "invite_accepted" : "invite_rejected";

      return notifyUserRequest(notification.senderId._id, {
        message,
        type,
        jobId: notification.jobId._id
      });
    },
    onSuccess: async (_, variables) => {
      if (variables.status === "accept" && notification?.senderId?._id) {
        try {
          // Auto-create/find a conversation with the client
          await findOrCreateConversationRequest(
            notification.senderId._id,
            notification.jobId?._id,
          );
        } catch {
          // Non-critical – chat can still be opened manually
        }
      }
      toast.success(variables.status === "accept" ? "Job accepted! The client has been notified." : "Job rejected! The client has been notified.");
      onOpenChange(false);
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to send response");
    }
  });

  if (!notification || !notification.jobId) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl rounded-2xl p-0 border border-border shadow-2xl overflow-hidden">
        <div className="bg-muted px-6 py-4 flex items-center justify-between border-b border-border">
          <DialogTitle className="text-xl font-display flex items-center gap-2">
            Job Invitation
            <Badge variant="secondary" className="bg-primary/10 text-primary hover:bg-primary/20">New</Badge>
          </DialogTitle>
        </div>
        
        <div className="px-6 py-6 flex flex-col gap-6">
          <div className="flex items-start gap-4">
            <img 
              src={notification.senderId.avatar} 
              alt={notification.senderId.fullName} 
              className="w-12 h-12 rounded-full border border-border shrink-0 object-cover"
            />
            <div>
              <h4 className="font-semibold text-foreground text-lg">{notification.senderId.fullName}</h4>
              <p className="text-sm text-muted-foreground">{notification.senderId.email}</p>
              <button 
                onClick={() => {
                  onOpenChange(false);
                  navigate(`${dashboardBasePath}/client/${notification.senderId._id}`);
                }}
                className="mt-2 text-sm text-primary font-medium hover:underline flex items-center gap-1"
              >
                <User className="w-3.5 h-3.5" />
                View Client Profile
              </button>
            </div>
          </div>

          <div className="rounded-xl border border-border bg-card p-5">
            <div className="flex justify-between items-start mb-4 gap-4">
              <div>
                <h5 className="font-bold text-foreground text-lg">{notification.jobId.title}</h5>
                <p className="text-sm text-muted-foreground mt-0.5">Budget info may be set • Open Status</p>
              </div>
              <button 
                onClick={() => {
                  onOpenChange(false);
                  navigate(`${dashboardBasePath}/job/${notification.jobId?._id}`);
                }}
                className="shrink-0 group relative inline-flex items-center justify-center gap-1.5 overflow-hidden rounded-lg bg-secondary/10 px-3 py-1.5 text-xs font-semibold text-secondary transition-all hover:bg-secondary/20 focus:outline-none"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                View Full Requirements
              </button>
            </div>
            <p className="text-sm text-foreground leading-relaxed line-clamp-3">
              {notification.jobId.description}
            </p>
          </div>
        </div>

        <DialogFooter className="bg-card px-6 py-4 border-t border-border flex flex-col-reverse sm:flex-row sm:justify-end gap-2">
          <button
            onClick={() => respondMutation.mutate({ status: "reject" })}
            disabled={respondMutation.isPending}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-destructive/20 bg-destructive/10 px-6 py-2.5 text-sm font-semibold text-destructive transition-all hover:bg-destructive/20 focus:outline-none disabled:pointer-events-none disabled:opacity-70"
          >
            {respondMutation.isPending && respondMutation.variables?.status === "reject" ? null : <XCircle className="w-4 h-4" />}
            Reject Job
          </button>
          <button
            onClick={() => respondMutation.mutate({ status: "accept" })}
            disabled={respondMutation.isPending}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-primary to-accent px-6 py-2.5 text-sm font-semibold text-white shadow-md transition-all hover:shadow-lg focus:outline-none disabled:pointer-events-none disabled:opacity-70"
          >
            {respondMutation.isPending && respondMutation.variables?.status === "accept" ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
            Accept Job
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
