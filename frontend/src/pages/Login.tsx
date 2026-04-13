import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Zap, Mail, Lock, ArrowLeft, ArrowRight, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import GoogleAuthButton from "@/components/auth/GoogleAuthButton";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import LoadingSpinner from "@/components/ui/loading-spinner";
import { googleAuthRequest, resetPasswordRequest, sendPasswordResetOtpRequest } from "@/lib/authApi";
import { requestGoogleCredential } from "@/lib/googleIdentity";

const stats = [
  ["50K+", "Freelancers"],
  ["12K+", "Companies"],
  ["98%", "Satisfaction"],
] as const;

const OTP_LENGTH = 6;
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGoogleSubmitting, setIsGoogleSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [isForgotPasswordFlow, setIsForgotPasswordFlow] = useState(false);
  const [resetStep, setResetStep] = useState<"request" | "verify">("request");
  const [resetEmail, setResetEmail] = useState("");
  const [resetOtp, setResetOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSendingResetOtp, setIsSendingResetOtp] = useState(false);
  const [isResettingPassword, setIsResettingPassword] = useState(false);
  const [resetErrorMessage, setResetErrorMessage] = useState("");
  const [resetMessage, setResetMessage] = useState("");
  const { login, applyServerSession } = useAuth();
  const navigate = useNavigate();
  const isResetBusy = isSendingResetOtp || isResettingPassword;

  const navigateForUser = (role: "client" | "freelancer" | null) => {
    navigate(role === "client" ? "/client-dashboard" : role ? "/dashboard" : "/role-select");
  };

  const openForgotPasswordFlow = () => {
    setIsForgotPasswordFlow(true);
    setResetStep("request");
    setResetEmail((currentEmail) => currentEmail || email.trim().toLowerCase());
    setResetOtp("");
    setNewPassword("");
    setConfirmPassword("");
    setResetErrorMessage("");
    setResetMessage("");
  };

  const closeForgotPasswordFlow = () => {
    setIsForgotPasswordFlow(false);
    setResetStep("request");
    setResetOtp("");
    setNewPassword("");
    setConfirmPassword("");
    setResetErrorMessage("");
    setResetMessage("");
  };

  const sendResetOtp = async () => {
    const cleanEmail = resetEmail.trim().toLowerCase();

    if (!emailPattern.test(cleanEmail)) {
      const message = "Enter a valid email address.";
      setResetErrorMessage(message);
      toast.error(message);
      return;
    }

    setIsSendingResetOtp(true);
    setResetErrorMessage("");

    try {
      const response = await sendPasswordResetOtpRequest(cleanEmail);
      setEmail(cleanEmail);
      setResetEmail(cleanEmail);
      setResetStep("verify");
      setResetOtp("");
      setResetMessage(response.message || `Code sent to ${cleanEmail}. Enter it below and choose a new password.`);
      toast.success(response.message || "OTP sent.");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to send OTP right now.";
      setResetErrorMessage(message);
      toast.error(message);
    } finally {
      setIsSendingResetOtp(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setIsSubmitting(true);
    setErrorMessage("");

    try {
      const sessionUser = await login(email, password);
      navigateForUser(sessionUser.role);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to log in right now.";
      setErrorMessage(message);
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleLogin = async () => {
    setIsGoogleSubmitting(true);
    setErrorMessage("");

    try {
      const credential = await requestGoogleCredential();
      const session = await googleAuthRequest(credential);
      const sessionUser = applyServerSession(session);
      navigateForUser(sessionUser.role);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to sign in with Google right now.";
      setErrorMessage(message);
      toast.error(message);
    } finally {
      setIsGoogleSubmitting(false);
    }
  };

  const handleSendResetOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    await sendResetOtp();
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();

    const cleanEmail = resetEmail.trim().toLowerCase();
    const cleanOtp = resetOtp.replace(/\D/g, "").slice(0, OTP_LENGTH);

    if (!emailPattern.test(cleanEmail)) {
      const message = "Enter a valid email address.";
      setResetErrorMessage(message);
      toast.error(message);
      return;
    }

    if (cleanOtp.length !== OTP_LENGTH) {
      const message = "Enter the 6-digit OTP.";
      setResetErrorMessage(message);
      toast.error(message);
      return;
    }

    if (newPassword.length < 8) {
      const message = "Password must be at least 8 characters.";
      setResetErrorMessage(message);
      toast.error(message);
      return;
    }

    if (newPassword !== confirmPassword) {
      const message = "Passwords do not match.";
      setResetErrorMessage(message);
      toast.error(message);
      return;
    }

    setIsResettingPassword(true);
    setResetErrorMessage("");

    try {
      const session = await resetPasswordRequest({
        email: cleanEmail,
        otp: cleanOtp,
        password: newPassword,
      });
      const sessionUser = applyServerSession(session);
      setPassword("");
      toast.success(session.message ?? "Password reset successfully.");
      navigateForUser(sessionUser.role);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to reset the password right now.";
      setResetErrorMessage(message);
      toast.error(message);
    } finally {
      setIsResettingPassword(false);
    }
  };

  return (
    <div className="relative flex min-h-screen overflow-hidden">
      {/* Animated background orbs */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="orb orb-float-slow orb-pulse absolute -left-32 -top-32 h-[500px] w-[500px] bg-[hsl(250,60%,25%)] opacity-40" />
        <div className="orb orb-float-medium absolute -bottom-20 -right-20 h-[400px] w-[400px] bg-[hsl(170,80%,25%)] opacity-30" />
        <div className="orb orb-float-fast absolute left-1/2 top-1/2 h-[300px] w-[300px] -translate-x-1/2 -translate-y-1/2 bg-[hsl(280,60%,20%)] opacity-20" />
      </div>

      {/* Left hero panel */}
      <div className="relative hidden flex-1 items-center justify-center overflow-hidden p-12 lg:flex">
        <div className="glass-card rounded-3xl p-12">
          <div className="relative text-center">
            <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-secondary shadow-lg glow-emerald">
              <Zap className="h-8 w-8 text-secondary-foreground" />
            </div>
            <h2 className="mb-4 text-4xl font-display font-bold tracking-[0.015em] text-foreground">ProConnect</h2>
            <p className="mx-auto max-w-xs text-[19px] tracking-[0.012em] text-muted-foreground">
              The professional marketplace connecting talent worldwide.
            </p>
            <div className="mt-12 flex justify-center gap-10">
              {stats.map(([value, label]) => (
                <div key={label} className="text-center">
                  <div className="text-2xl font-display font-bold text-gradient">{value}</div>
                  <div className="mt-0.5 text-[13px] text-muted-foreground">{label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Right form panel */}
      <div className="relative flex flex-1 items-center justify-center px-8 py-12 lg:max-w-md">
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-sm"
        >
          <Link to="/" className="mb-10 inline-flex items-center gap-2 lg:hidden">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-secondary glow-emerald">
              <Zap className="h-4 w-4 text-secondary-foreground" />
            </div>
            <span className="text-lg font-display font-bold text-foreground">ProConnect</span>
          </Link>

          <div className="mb-8">
            {isForgotPasswordFlow ? (
              <>
                <button
                  type="button"
                  onClick={closeForgotPasswordFlow}
                  disabled={isResetBusy}
                  className="mb-4 inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground disabled:cursor-not-allowed disabled:opacity-70"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Back to sign in
                </button>
                <h1 className="text-3xl font-display font-bold tracking-[0.015em] text-foreground">Reset password</h1>
                <p className="mt-2 text-[15px] tracking-[0.012em] text-muted-foreground">
                  {resetStep === "request"
                    ? "Enter your email and we'll send a 6-digit OTP."
                    : "Enter the OTP from your email and choose a new password."}
                </p>
              </>
            ) : (
              <>
                <h1 className="text-3xl font-display font-bold tracking-[0.015em] text-foreground">Welcome back</h1>
                <p className="mt-2 text-[15px] tracking-[0.012em] text-muted-foreground">Sign in to your account to continue</p>
              </>
            )}
          </div>

          {isForgotPasswordFlow ? (
            <>
              {resetErrorMessage ? (
                <div className="mb-4 rounded-2xl border border-destructive/20 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                  {resetErrorMessage}
                </div>
              ) : null}
              {resetMessage ? (
                <div className="mb-4 rounded-2xl border border-secondary/20 bg-secondary/10 px-3 py-2 text-sm text-foreground">
                  {resetMessage}
                </div>
              ) : null}

              {resetStep === "request" ? (
                <form onSubmit={handleSendResetOtp} className="space-y-5">
                  <div>
                    <label htmlFor="reset-email" className="mb-1.5 block text-[15px] font-medium text-foreground">
                      Email address
                    </label>
                    <div className="relative">
                      <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <input
                        id="reset-email"
                        type="email"
                        value={resetEmail}
                        onChange={(e) => {
                          setResetEmail(e.target.value);
                          if (resetErrorMessage) setResetErrorMessage("");
                        }}
                        className="w-full rounded-xl border border-border bg-muted/40 py-3 pl-10 pr-4 text-[15px] text-foreground transition-all placeholder:text-muted-foreground focus:border-secondary/50 focus:outline-none focus:ring-2 focus:ring-secondary/20"
                        placeholder="you@example.com"
                        required
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isSendingResetOtp}
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-primary to-accent py-3 text-[15px] font-semibold text-white shadow-sm transition-all hover:opacity-90 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-70"
                  >
                    {isSendingResetOtp ? <LoadingSpinner className="h-4 w-4" /> : null}
                    <span>{isSendingResetOtp ? "Sending OTP..." : "Send OTP"}</span>
                    {!isSendingResetOtp ? <ArrowRight className="h-4 w-4" /> : null}
                  </button>
                </form>
              ) : (
                <form onSubmit={handleResetPassword} className="space-y-5">
                  <div>
                    <label htmlFor="reset-email" className="mb-1.5 block text-[15px] font-medium text-foreground">
                      Email address
                    </label>
                    <div className="relative">
                      <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <input
                        id="reset-email"
                        type="email"
                        value={resetEmail}
                        onChange={(e) => {
                          setResetEmail(e.target.value);
                          if (resetErrorMessage) setResetErrorMessage("");
                        }}
                        className="w-full rounded-xl border border-border bg-muted/40 py-3 pl-10 pr-4 text-[15px] text-foreground transition-all placeholder:text-muted-foreground focus:border-secondary/50 focus:outline-none focus:ring-2 focus:ring-secondary/20"
                        placeholder="you@example.com"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <div className="mb-1.5 flex items-center justify-between">
                      <label htmlFor="reset-otp" className="block text-[15px] font-medium text-foreground">
                        One-time password
                      </label>
                      <button
                        type="button"
                        onClick={() => void sendResetOtp()}
                        disabled={isSendingResetOtp}
                        className="inline-flex items-center gap-2 text-sm font-medium text-secondary transition-colors hover:underline disabled:cursor-not-allowed disabled:no-underline disabled:opacity-70"
                      >
                        {isSendingResetOtp ? <LoadingSpinner className="h-3.5 w-3.5" /> : null}
                        <span>{isSendingResetOtp ? "Resending..." : "Resend code"}</span>
                      </button>
                    </div>
                    <div className="rounded-2xl border border-border bg-muted/20 px-3 py-4">
                      <InputOTP
                        id="reset-otp"
                        maxLength={OTP_LENGTH}
                        value={resetOtp}
                        onChange={(value) => {
                          setResetOtp(value.replace(/\D/g, "").slice(0, OTP_LENGTH));
                          if (resetErrorMessage) setResetErrorMessage("");
                        }}
                        aria-label="One-time password"
                      >
                        <InputOTPGroup className="w-full justify-center gap-1.5">
                          <InputOTPSlot index={0} className="h-11 w-9 rounded-xl border border-border bg-card text-sm font-semibold text-foreground first:rounded-xl first:border last:rounded-xl" />
                          <InputOTPSlot index={1} className="h-11 w-9 rounded-xl border border-border bg-card text-sm font-semibold text-foreground first:rounded-xl first:border last:rounded-xl" />
                          <InputOTPSlot index={2} className="h-11 w-9 rounded-xl border border-border bg-card text-sm font-semibold text-foreground first:rounded-xl first:border last:rounded-xl" />
                          <InputOTPSlot index={3} className="h-11 w-9 rounded-xl border border-border bg-card text-sm font-semibold text-foreground first:rounded-xl first:border last:rounded-xl" />
                          <InputOTPSlot index={4} className="h-11 w-9 rounded-xl border border-border bg-card text-sm font-semibold text-foreground first:rounded-xl first:border last:rounded-xl" />
                          <InputOTPSlot index={5} className="h-11 w-9 rounded-xl border border-border bg-card text-sm font-semibold text-foreground first:rounded-xl first:border last:rounded-xl" />
                        </InputOTPGroup>
                      </InputOTP>
                    </div>
                  </div>

                  <div>
                    <label htmlFor="reset-new-password" className="mb-1.5 block text-[15px] font-medium text-foreground">
                      New password
                    </label>
                    <div className="relative">
                      <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <input
                        id="reset-new-password"
                        type={showNewPassword ? "text" : "password"}
                        value={newPassword}
                        onChange={(e) => {
                          setNewPassword(e.target.value);
                          if (resetErrorMessage) setResetErrorMessage("");
                        }}
                        className="w-full rounded-xl border border-border bg-muted/40 py-3 pl-10 pr-10 text-[15px] text-foreground transition-all placeholder:text-muted-foreground focus:border-secondary/50 focus:outline-none focus:ring-2 focus:ring-secondary/20"
                        placeholder="At least 8 characters"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPassword((value) => !value)}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
                      >
                        {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label htmlFor="reset-confirm-password" className="mb-1.5 block text-[15px] font-medium text-foreground">
                      Confirm new password
                    </label>
                    <div className="relative">
                      <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <input
                        id="reset-confirm-password"
                        type={showConfirmPassword ? "text" : "password"}
                        value={confirmPassword}
                        onChange={(e) => {
                          setConfirmPassword(e.target.value);
                          if (resetErrorMessage) setResetErrorMessage("");
                        }}
                        className="w-full rounded-xl border border-border bg-muted/40 py-3 pl-10 pr-10 text-[15px] text-foreground transition-all placeholder:text-muted-foreground focus:border-secondary/50 focus:outline-none focus:ring-2 focus:ring-secondary/20"
                        placeholder="Repeat your new password"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword((value) => !value)}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
                      >
                        {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        setResetStep("request");
                        setResetOtp("");
                        setNewPassword("");
                        setConfirmPassword("");
                        setResetErrorMessage("");
                        setResetMessage("");
                      }}
                      disabled={isResetBusy}
                      className="flex-1 rounded-xl border border-border bg-muted/30 py-3 text-[15px] font-semibold text-foreground transition-colors hover:bg-muted/50 disabled:cursor-not-allowed disabled:opacity-70"
                    >
                      Change email
                    </button>
                    <button
                      type="submit"
                      disabled={isResettingPassword}
                      className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-primary to-accent py-3 text-[15px] font-semibold text-white shadow-sm transition-all hover:opacity-90 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-70"
                    >
                      {isResettingPassword ? <LoadingSpinner className="h-4 w-4" /> : null}
                      <span>{isResettingPassword ? "Resetting..." : "Reset & Sign In"}</span>
                      {!isResettingPassword ? <ArrowRight className="h-4 w-4" /> : null}
                    </button>
                  </div>
                </form>
              )}
            </>
          ) : (
            <>
              {errorMessage ? (
                <div className="mb-4 rounded-2xl border border-destructive/20 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                  {errorMessage}
                </div>
              ) : null}

              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label htmlFor="login-email" className="mb-1.5 block text-[15px] font-medium text-foreground">
                    Email address
                  </label>
                  <div className="relative">
                    <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <input
                      id="login-email"
                      type="email"
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        if (errorMessage) setErrorMessage("");
                      }}
                      className="w-full rounded-xl border border-border bg-muted/40 py-3 pl-10 pr-4 text-[15px] text-foreground transition-all placeholder:text-muted-foreground focus:border-secondary/50 focus:outline-none focus:ring-2 focus:ring-secondary/20"
                      placeholder="you@example.com"
                      required
                    />
                  </div>
                </div>

                <div>
                  <div className="mb-1.5 flex items-center justify-between">
                    <label htmlFor="login-password" className="block text-[15px] font-medium text-foreground">
                      Password
                    </label>
                    <button
                      type="button"
                      onClick={openForgotPasswordFlow}
                      className="text-sm text-secondary transition-colors hover:underline"
                    >
                      Forgot password?
                    </button>
                  </div>
                  <div className="relative">
                    <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <input
                      id="login-password"
                      type={showPass ? "text" : "password"}
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value);
                        if (errorMessage) setErrorMessage("");
                      }}
                      className="w-full rounded-xl border border-border bg-muted/40 py-3 pl-10 pr-10 text-[15px] text-foreground transition-all placeholder:text-muted-foreground focus:border-secondary/50 focus:outline-none focus:ring-2 focus:ring-secondary/20"
                      placeholder="Enter your password"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPass(!showPass)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
                    >
                      {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-primary to-accent py-3 text-[15px] font-semibold text-white shadow-sm transition-all hover:opacity-90 hover:shadow-[0_0_24px_hsl(250,60%,55%,0.3)] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {isSubmitting ? <LoadingSpinner className="h-4 w-4" /> : null}
                  <span>{isSubmitting ? "Signing In..." : "Sign In"}</span>
                  {!isSubmitting ? <ArrowRight className="h-4 w-4" /> : null}
                </button>
              </form>
            </>
          )}

          {!isForgotPasswordFlow ? (
            <>
              <div className="my-5 flex items-center gap-3 text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
                <span className="h-px flex-1 bg-border" />
                <span>Or continue with</span>
                <span className="h-px flex-1 bg-border" />
              </div>

              <GoogleAuthButton label={isGoogleSubmitting ? "Signing in with Google..." : "Sign in with Google"} onClick={() => void handleGoogleLogin()} disabled={isGoogleSubmitting} />

              <p className="mt-6 text-center text-[15px] text-muted-foreground">
                Don&apos;t have an account?{" "}
                <Link to="/signup" className="font-semibold text-secondary hover:underline">
                  Create one free
                </Link>
              </p>
            </>
          ) : (
            <p className="mt-6 text-center text-[15px] text-muted-foreground">
              Remembered it?{" "}
              <button
                type="button"
                onClick={closeForgotPasswordFlow}
                disabled={isResetBusy}
                className="font-semibold text-secondary hover:underline disabled:cursor-not-allowed disabled:no-underline disabled:opacity-70"
              >
                Go back to sign in
              </button>
            </p>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default Login;
