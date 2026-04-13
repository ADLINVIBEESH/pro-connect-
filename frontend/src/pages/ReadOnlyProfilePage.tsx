import { Navigate, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { CheckCircle2, BookmarkPlus, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { fetchReadOnlyProfileRequest, notifyUserRequest, saveFreelancerRequest } from "@/lib/userApi";
import { fetchMyJobsRequest } from "@/lib/networkApi";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useState } from "react";
import { sanitizeClientProfileData } from "@/lib/clientProfileCompletion";
import { sanitizeProfileData } from "@/lib/profileCompletion";
import { DashboardTopbar } from "@/components/dashboard/DashboardTopbar";
import DashboardFooter from "@/components/dashboard/DashboardFooter";
import FreelancerSelfProfileView from "@/components/profile/FreelancerSelfProfileView";
import ClientSelfProfileView from "@/components/profile/ClientSelfProfileView";

const ReadOnlyProfilePage = () => {
  const { userId = "" } = useParams();
  const { isAuthenticated, user } = useAuth();
  const queryClient = useQueryClient();
  const profileQuery = useQuery({
    queryKey: ["read-only-profile", userId],
    queryFn: () => fetchReadOnlyProfileRequest(userId),
    enabled: Boolean(userId),
  });
  const shouldShowFooter = profileQuery.data?.role === "freelancer";
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [selectedJobId, setSelectedJobId] = useState("");

  const jobsQuery = useQuery({
    queryKey: ["my-jobs", "client"],
    queryFn: () => fetchMyJobsRequest(false),
    enabled: user?.role === "client",
  });

  const saveMutation = useMutation({
    mutationFn: (freelancerId: string) => saveFreelancerRequest(freelancerId),
    onSuccess: () => {
      toast.success("Freelancer saved successfully!");
      queryClient.invalidateQueries({ queryKey: ["saved-freelancers"] });
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to save freelancer");
    },
  });

  const notifyMutation = useMutation({
    mutationFn: (data: { freelancerId: string, jobId: string }) => notifyUserRequest(data.freelancerId, { 
      message: `Client ${user?.name || "Someone"} has invited you to a job!`,
      type: "job_invite",
      jobId: data.jobId
    }),
    onSuccess: () => {
      toast.success("Invitation sent successfully!");
      setIsInviteOpen(false);
      setSelectedJobId("");
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to notify freelancer");
    },
  });

  if (!isAuthenticated) return <Navigate to="/login" replace />;

  return (
    <div className="dashboard-shell min-h-screen bg-background">
      <div className="flex min-h-screen flex-col">
        <DashboardTopbar />
        <main className="mx-auto w-full max-w-[1520px] flex-1 px-4 py-5 lg:px-8 lg:py-6">
          {profileQuery.isLoading ? <p className="py-12 text-center text-sm text-muted-foreground">Loading profile...</p> : null}

          {profileQuery.isError ? (
            <p className="py-12 text-center text-sm text-destructive">
              {profileQuery.error instanceof Error ? profileQuery.error.message : "Unable to load that profile right now."}
            </p>
          ) : null}

          {!profileQuery.isLoading && !profileQuery.isError && profileQuery.data?.role === "freelancer" ? (
            <div className="space-y-6">
              <FreelancerSelfProfileView
                user={{
                  name: profileQuery.data.user.fullName,
                  email: profileQuery.data.user.email,
                  avatar: profileQuery.data.user.avatar ?? "",
                  profile_completed: Boolean(profileQuery.data.user.freelancerProfile?.profileCompleted),
                  username: profileQuery.data.user.username,
                }}
                profile={sanitizeProfileData(profileQuery.data.user.freelancerProfile?.profileData)}
                onEditProfile={() => {}}
                showEditButton={false}
              />
              
              {user?.role === "client" ? (
                <div className="mt-8 overflow-hidden rounded-2xl border border-border bg-card p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] relative">
                  <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-accent/5 pointer-events-none" />
                  <div className="relative flex flex-col items-center justify-between gap-6 sm:flex-row sm:px-4">
                    <div className="text-center sm:text-left">
                      <h3 className="text-xl font-display font-bold text-foreground">Like this profile?</h3>
                      <p className="mt-1 text-sm text-muted-foreground">Save it for later or accept to notify them instantly.</p>
                    </div>
                    <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
                      <button
                        onClick={() => saveMutation.mutate(userId)}
                        disabled={saveMutation.isPending}
                        className="group relative inline-flex items-center justify-center gap-2 overflow-hidden rounded-xl border border-border bg-background px-6 py-3 text-sm font-semibold text-foreground transition-all duration-300 hover:border-primary/50 hover:bg-muted focus:outline-none focus:ring-2 focus:ring-primary/20 active:scale-95 disabled:pointer-events-none disabled:opacity-70"
                      >
                        {saveMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <BookmarkPlus className="h-4 w-4 text-muted-foreground transition-colors group-hover:text-primary" />}
                        Save to Menu
                      </button>
                      <button
                        onClick={() => setIsInviteOpen(true)}
                        className="group relative inline-flex items-center justify-center gap-2 overflow-hidden rounded-xl bg-gradient-to-r from-primary to-accent px-8 py-3 text-sm font-bold text-white shadow-lg transition-all duration-300 hover:scale-[1.02] hover:shadow-xl hover:shadow-primary/25 focus:outline-none focus:ring-2 focus:ring-primary/20 active:scale-95 disabled:pointer-events-none disabled:opacity-70"
                      >
                        <CheckCircle2 className="h-4 w-4 transition-transform group-hover:scale-110" />
                        Invite to Job
                      </button>
                    </div>
                  </div>
                </div>
              ) : null}

              {/* Invite Modal */}
              <Dialog open={isInviteOpen} onOpenChange={setIsInviteOpen}>
                <DialogContent className="sm:max-w-md rounded-2xl p-6 border border-border shadow-2xl">
                  <DialogHeader>
                    <DialogTitle className="text-xl font-display">Invite to Job</DialogTitle>
                    <DialogDescription>
                      Select an active job to invite {profileQuery.data.user.fullName} to.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="py-4">
                    {jobsQuery.isLoading ? (
                      <p className="text-sm text-muted-foreground text-center">Loading your jobs...</p>
                    ) : jobsQuery.isError ? (
                      <p className="text-sm text-destructive text-center">Failed to load jobs.</p>
                    ) : jobsQuery.data?.jobs?.length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center">You have no open jobs. Please create a job first.</p>
                    ) : (
                      <div className="flex flex-col gap-2 max-h-[200px] overflow-y-auto dashboard-scroll pr-2">
                        {jobsQuery.data?.jobs?.map((job) => (
                          <button
                            key={job.id}
                            onClick={() => setSelectedJobId(job.id)}
                            className={`flex flex-col items-start p-3 rounded-xl border text-left transition-all ${
                              selectedJobId === job.id
                                ? "border-primary bg-primary/10"
                                : "border-border hover:border-primary/50 hover:bg-muted"
                            }`}
                          >
                            <span className="font-semibold text-foreground text-sm">{job.title}</span>
                            <span className="text-xs text-muted-foreground mt-0.5">{job.domain} • {job.experienceLevel}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  <DialogFooter className="sm:justify-end gap-2 sm:gap-0 mt-2">
                    <button
                      type="button"
                      onClick={() => setIsInviteOpen(false)}
                      className="px-4 py-2 rounded-xl text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      disabled={!selectedJobId || notifyMutation.isPending}
                      onClick={() => notifyMutation.mutate({ freelancerId: userId, jobId: selectedJobId })}
                      className="group relative inline-flex items-center justify-center gap-2 overflow-hidden rounded-xl bg-gradient-to-r from-primary to-accent px-6 py-2 text-sm font-bold text-white shadow-md transition-all hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-primary/20 active:scale-95 disabled:pointer-events-none disabled:opacity-70"
                    >
                      {notifyMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                      Send Invitation
                    </button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          ) : null}

          {!profileQuery.isLoading && !profileQuery.isError && profileQuery.data?.role === "client" ? (
            <ClientSelfProfileView
              user={{
                name: profileQuery.data.user.fullName,
                email: profileQuery.data.user.email,
                avatar: profileQuery.data.user.avatar ?? "",
                client_profile_completed: Boolean(profileQuery.data.user.clientProfile?.profileCompleted),
              }}
              profile={sanitizeClientProfileData(profileQuery.data.user.clientProfile?.profileData)}
              onEditProfile={() => {}}
              showEditButton={false}
            />
          ) : null}

          {!profileQuery.isLoading && !profileQuery.isError && !profileQuery.data?.role ? (
            <p className="py-12 text-center text-sm text-muted-foreground">Profile not found.</p>
          ) : null}
        </main>
        {shouldShowFooter ? (
          <div className="mx-auto w-full max-w-[1520px] px-4 pb-6 lg:px-8">
            <DashboardFooter />
          </div>
        ) : null}
      </div>
    </div>
  );
};

export default ReadOnlyProfilePage;
