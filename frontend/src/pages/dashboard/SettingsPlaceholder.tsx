import { useState } from "react";
import { motion } from "framer-motion";
import { AlertTriangle, Settings } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { deleteAccountRequest } from "@/lib/userApi";
import { requestGoogleCredential } from "@/lib/googleIdentity";

const SettingsPlaceholder = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const deleteMutation = useMutation({
    mutationFn: deleteAccountRequest,
    onSuccess: () => {
      logout();
      navigate("/login", { replace: true });
    },
    onError: (error) => {
      setErrorMessage(error instanceof Error ? error.message : "Unable to delete the account right now.");
    },
  });

  const handleDelete = async () => {
    setErrorMessage("");

    if (user?.hasPassword) {
      deleteMutation.mutate({ password });
      return;
    }

    try {
      const googleCredential = await requestGoogleCredential();
      deleteMutation.mutate({ googleCredential });
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Google re-authentication was cancelled.");
    }
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.22, ease: "easeOut" }}
        className="rounded-[12px] border border-border bg-card p-6 shadow-[0_18px_40px_-32px_rgba(0,0,0,0.58)]"
      >
        <div className="flex h-12 w-12 items-center justify-center rounded-[12px] bg-muted/55 text-foreground">
          <Settings className="h-5 w-5" />
        </div>
        <h1 className="mt-5 text-[1.8rem] font-display font-semibold text-foreground">Settings</h1>
        <p className="mt-3 max-w-2xl text-[15px] leading-7 text-muted-foreground">
          Manage your account-level actions here. Deleting your account permanently removes your profile, jobs, applications, and saved jobs.
        </p>

        <div className="mt-8 rounded-[12px] border border-destructive/25 bg-destructive/5 p-5">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-destructive/10 text-destructive">
              <AlertTriangle className="h-5 w-5" />
            </div>
            <div className="flex-1">
              <h2 className="text-lg font-display font-semibold text-foreground">Delete Account</h2>
              <p className="mt-2 text-sm leading-7 text-muted-foreground">
                This action is permanent and cannot be undone.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              setDeleteOpen(true);
              setPassword("");
              setErrorMessage("");
            }}
            className="mt-4 rounded-[10px] bg-destructive px-4 py-2.5 text-sm font-semibold text-destructive-foreground transition-opacity hover:opacity-90"
          >
            Delete Account
          </button>
        </div>
      </motion.div>

      {deleteOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-[16px] border border-border bg-card p-5 shadow-2xl">
            <h2 className="text-lg font-display font-semibold text-foreground">Are you sure you want to delete your account?</h2>
            <p className="mt-2 text-sm leading-7 text-muted-foreground">This action cannot be undone.</p>

            {user?.hasPassword ? (
              <div className="mt-4">
                <label htmlFor="delete-account-password" className="dashboard-label">
                  Enter your password
                </label>
                <input
                  id="delete-account-password"
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  className="dashboard-input mt-2"
                  placeholder="Enter your password"
                />
              </div>
            ) : (
              <p className="mt-4 rounded-[10px] border border-border bg-muted/40 px-3 py-3 text-sm text-muted-foreground">
                Google-only accounts must complete a fresh Google sign-in before deletion.
              </p>
            )}

            {errorMessage ? <p className="mt-3 text-sm text-destructive">{errorMessage}</p> : null}

            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setDeleteOpen(false)}
                className="rounded-[10px] border border-border px-4 py-2.5 text-sm font-semibold text-foreground transition-colors hover:bg-muted/40"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => void handleDelete()}
                disabled={deleteMutation.isPending}
                className="rounded-[10px] bg-destructive px-4 py-2.5 text-sm font-semibold text-destructive-foreground transition-opacity hover:opacity-90 disabled:opacity-70"
              >
                {deleteMutation.isPending ? "Deleting..." : "Delete Account"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
};

export default SettingsPlaceholder;
