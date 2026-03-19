import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowRight,
  AtSign,
  CheckCircle2,
  Eye,
  EyeOff,
  Lock,
  Mail,
  RefreshCw,
  User,
  Zap,
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import GoogleAuthButton from "@/components/auth/GoogleAuthButton";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import LoadingSpinner from "@/components/ui/loading-spinner";
import {
  completeSignupRequest,
  googleAuthRequest,
  sendOtpRequest,
  verifyOtpRequest,
} from "@/lib/authApi";
import { requestGoogleCredential } from "@/lib/googleIdentity";

const featureHighlights = ["Email OTP protected", "No hidden fees", "50,000+ opportunities"];
const OTP_LENGTH = 6;
const RESEND_SECONDS = 30;
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const usernamePattern = /^[a-zA-Z0-9._-]{3,24}$/;
const signupSteps = ["email", "otp", "account"] as const;

type SignupStep = (typeof signupSteps)[number];

const normalizeUsername = (value: string) =>
  value
    .trim()
    .replace(/^@+/, "")
    .replace(/\s+/g, "")
    .replace(/[^a-zA-Z0-9._-]/g, "")
    .slice(0, 24);

const getErrorMessage = (error: unknown) => (error instanceof Error ? error.message : "Something went wrong.");

const Signup = () => {
  const [step, setStep] = useState<SignupStep>("email");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [verifiedUserId, setVerifiedUserId] = useState("");
  const [resendIn, setResendIn] = useState(0);
  const [showPass, setShowPass] = useState(false);
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);
  const [isCreatingAccount, setIsCreatingAccount] = useState(false);
  const [isGoogleSubmitting, setIsGoogleSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const { applyServerSession } = useAuth();
  const navigate = useNavigate();

  const normalizedEmail = email.trim().toLowerCase();
  const normalizedUsername = normalizeUsername(username);
  const currentStepIndex = signupSteps.indexOf(step);
  const isBusy = isSendingOtp || isVerifyingOtp || isCreatingAccount;

  useEffect(() => {
    if (resendIn <= 0) return;

    // The resend timer is UI-only; the backend still controls real OTP expiry.
    const timerId = window.setTimeout(() => {
      setResendIn((current) => Math.max(current - 1, 0));
    }, 1000);

    return () => window.clearTimeout(timerId);
  }, [resendIn]);

  const clearFeedback = () => {
    setErrorMessage("");
    setSuccessMessage("");
  };

  const handleEmailChange = (value: string) => {
    setEmail(value);
    if (step !== "email") {
      setStep("email");
      setOtp("");
      setVerifiedUserId("");
      setResendIn(0);
    }
    clearFeedback();
  };

  const handleSendOtp = async (mode: "send" | "resend" = "send") => {
    if (!emailPattern.test(normalizedEmail)) {
      const message = "Enter a valid email address.";
      setErrorMessage(message);
      setSuccessMessage("");
      toast.error(message);
      return;
    }

    setIsSendingOtp(true);
    clearFeedback();

    try {
      // const response = await sendOtpRequest(normalizedEmail);

      setEmail(normalizedEmail);
      setStep("otp");
      setOtp("");
      setVerifiedUserId("");
      setResendIn(RESEND_SECONDS);
      setSuccessMessage(mode === "resend" ? "New code sent." : "Code sent.");
      setUsername((current) => (current.trim() ? current : normalizedEmail.split("@")[0] ?? ""));
      toast.success(mode === "resend" ? "New mocked code sent." : "Mock code sent.");
    } catch (error) {
      const message = getErrorMessage(error);
      setErrorMessage(message);
      toast.error(message);
    } finally {
      setIsSendingOtp(false);
    }
  };

  const handleVerifyOtp = async () => {
    const cleanOtp = otp.replace(/\D/g, "").slice(0, OTP_LENGTH);

    if (cleanOtp.length !== OTP_LENGTH) {
      const message = "Enter the 6-digit OTP.";
      setErrorMessage(message);
      setSuccessMessage("");
      return;
    }

    setIsVerifyingOtp(true);
    clearFeedback();

    try {
      // const response = await verifyOtpRequest(normalizedEmail, cleanOtp);

      setOtp(cleanOtp);
      setVerifiedUserId("mock_user_id");
      setStep("account");
      setResendIn(0);
      setSuccessMessage("Email verified.");
      setUsername((current) => (current.trim() ? current : normalizedEmail.split("@")[0] ?? ""));
      toast.success("Mock verification successful");
    } catch (error) {
      const message = getErrorMessage(error);
      setErrorMessage(message);
      toast.error(message);
    } finally {
      setIsVerifyingOtp(false);
    }
  };

  const handleCreateAccount = async () => {
    if (!verifiedUserId) {
      const message = "Verify your email first.";
      setErrorMessage(message);
      setSuccessMessage("");
      return;
    }

    if (fullName.trim().length < 2) {
      const message = "Enter your full name.";
      setErrorMessage(message);
      setSuccessMessage("");
      return;
    }

    if (!usernamePattern.test(normalizedUsername)) {
      const message = "Use 3-24 letters, numbers, dots, underscores, or hyphens.";
      setErrorMessage(message);
      setSuccessMessage("");
      return;
    }

    if (password.length < 8) {
      const message = "Password must be at least 8 characters.";
      setErrorMessage(message);
      setSuccessMessage("");
      return;
    }

    setIsCreatingAccount(true);
    clearFeedback();

    try {
      /*
      const response = await completeSignupRequest({
        userId: verifiedUserId,
        username: normalizedUsername,
        fullName: fullName.trim(),
        password,
      });
      */

      const response = {
        token: "mock-token",
        user: {
          id: "mock_" + normalizedUsername,
          email: normalizedEmail,
          fullName: fullName.trim(),
          role: null as any,
          hasPassword: true,
        },
        message: "Account created successfully"
      };

      applyServerSession({
        token: response.token,
        user: response.user as any,
      });
      toast.success(response.message);
      navigate("/role-select");
    } catch (error) {
      const message = getErrorMessage(error);
      setErrorMessage(message);
      toast.error(message);
    } finally {
      setIsCreatingAccount(false);
    }
  };

  const handleFormSubmit = (event: React.FormEvent) => {
    event.preventDefault();

    if (step === "email") {
      void handleSendOtp();
      return;
    }

    if (step === "otp") {
      void handleVerifyOtp();
      return;
    }

    void handleCreateAccount();
  };

  const handleGoogleSignup = async () => {
    setIsGoogleSubmitting(true);
    clearFeedback();

    try {
      // const credential = await requestGoogleCredential();
      // const session = await googleAuthRequest(credential);
      const session = {
        token: "mock-token",
        user: {
          id: "mock_google_id",
          email: "google@example.com",
          fullName: "Google User",
          role: null as any,
          hasPassword: false,
        },
        message: "Signed in with Google"
      };

      applyServerSession({
        token: session.token,
        user: session.user as any,
      });
      toast.success(session.message ?? "Signed in with Google.");
      navigate("/role-select");
    } catch (error) {
      const message = getErrorMessage(error);
      setErrorMessage(message);
      toast.error(message);
    } finally {
      setIsGoogleSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-background">
      <div className="relative hidden flex-1 items-center justify-center overflow-hidden p-12 hero-gradient lg:flex">
        <div className="absolute inset-0 opacity-10">
          {[...Array(6)].map((_, index) => (
            <div
              key={index}
              className="absolute rounded-full border border-white/20"
              style={{
                width: `${120 + index * 80}px`,
                height: `${120 + index * 80}px`,
                top: "50%",
                left: "50%",
                transform: "translate(-50%, -50%)",
              }}
            />
          ))}
        </div>

        <div className="relative text-center">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-secondary shadow-lg">
            <Zap className="h-8 w-8 text-secondary-foreground" />
          </div>
          <h2 className="mb-4 text-4xl font-display font-bold tracking-[0.015em] text-white">Join ProConnect</h2>
          <p className="mx-auto max-w-xs text-[19px] tracking-[0.012em] text-white/68">
            Start your journey with thousands of professionals worldwide.
          </p>
          <div className="mx-auto mt-10 grid max-w-xs grid-cols-1 gap-3">
            {featureHighlights.map((feature) => (
              <div key={feature} className="rounded-lg bg-white/6 px-4 py-2.5 text-[15px] text-white/74">
                {feature}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="flex flex-1 items-center justify-center px-5 py-6 lg:max-w-[24rem]">
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-[21.5rem]"
        >
          <Link to="/" className="mb-6 inline-flex items-center gap-2 lg:hidden">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-secondary">
              <Zap className="h-4 w-4 text-secondary-foreground" />
            </div>
            <span className="text-lg font-display font-bold text-foreground">ProConnect</span>
          </Link>

          <div className="mb-4">
            <h1 className="text-3xl font-display font-bold tracking-[0.015em] text-foreground">Create account</h1>
            <p className="mt-1 text-sm text-muted-foreground">Email first signup.</p>
          </div>

          <div className="mb-4">
            <GoogleAuthButton label={isGoogleSubmitting ? "Signing in with Google..." : "Sign up with Google"} onClick={() => void handleGoogleSignup()} disabled={isGoogleSubmitting} />
          </div>

          <div className="my-4 flex items-center gap-3 text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
            <span className="h-px flex-1 bg-border" />
            <span>or</span>
            <span className="h-px flex-1 bg-border" />
          </div>

          <div className="mb-4 flex gap-2">
            {signupSteps.map((signupStep, index) => {
              const isActive = signupStep === step;
              const isDone = index < currentStepIndex;

              return (
                <div
                  key={signupStep}
                  className={[
                    "flex-1 rounded-full border px-2 py-1 text-center text-[11px] font-semibold uppercase tracking-[0.12em] transition-colors",
                    isActive ? "border-secondary bg-secondary/10 text-secondary" : "",
                    isDone ? "border-secondary/20 bg-secondary text-secondary-foreground" : "",
                    !isActive && !isDone ? "border-border bg-card text-muted-foreground" : "",
                  ].join(" ")}
                >
                  {signupStep}
                </div>
              );
            })}
          </div>

          {errorMessage ? (
            <div className="mb-4 rounded-2xl border border-destructive/20 bg-destructive/5 px-3 py-2 text-sm text-destructive">
              {errorMessage}
            </div>
          ) : null}

          {!errorMessage && successMessage ? (
            <div className="mb-4 rounded-2xl border border-secondary/20 bg-secondary/5 px-3 py-2 text-sm text-secondary">
              {successMessage}
            </div>
          ) : null}

          <form onSubmit={handleFormSubmit}>
            {step === "email" ? (
              <section className="rounded-3xl border border-border bg-card/70 p-4 shadow-sm">
                <h2 className="text-lg font-display font-semibold text-foreground">Email</h2>

                <div className="mt-4">
                  <label htmlFor="signup-email" className="mb-1.5 block text-[15px] font-medium text-foreground">
                    Email address
                  </label>
                  <div className="relative">
                    <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <input
                      id="signup-email"
                      type="email"
                      value={email}
                      onChange={(event) => handleEmailChange(event.target.value)}
                      className="w-full rounded-xl border border-border bg-muted/60 py-3 pl-10 pr-4 text-[15px] text-foreground transition-all placeholder:text-muted-foreground focus:border-transparent focus:outline-none focus:ring-2 focus:ring-ring"
                      placeholder="you@example.com"
                      autoComplete="email"
                      required
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isBusy}
                  className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-accent py-2.5 text-sm font-semibold text-accent-foreground shadow-sm transition-all hover:opacity-90 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {isSendingOtp ? <LoadingSpinner className="h-4 w-4" /> : null}
                  <span>{isSendingOtp ? "Sending OTP..." : "Send OTP"}</span>
                  {!isSendingOtp ? <ArrowRight className="h-4 w-4" /> : null}
                </button>
              </section>
              ) : null}

            {step === "otp" ? (
              <section className="rounded-3xl border border-border bg-card/70 p-4 shadow-sm">
                <div className="flex items-center justify-between gap-3">
                  <h2 className="text-lg font-display font-semibold text-foreground">OTP</h2>
                  <button
                    type="button"
                    onClick={() => handleEmailChange(email)}
                    disabled={isBusy}
                    className="text-sm font-medium text-secondary transition-colors hover:underline disabled:cursor-not-allowed disabled:no-underline disabled:opacity-70"
                  >
                    Change
                  </button>
                </div>

                <p className="mt-2 text-sm text-muted-foreground">Code sent to {normalizedEmail}</p>

                <div className="mt-4">
                  <label className="mb-1.5 block text-[15px] font-medium text-foreground">Verification code</label>
                  <div className="rounded-2xl border border-border bg-background px-2 py-3">
                    <InputOTP
                      maxLength={OTP_LENGTH}
                      value={otp}
                      onChange={(value) => {
                        setOtp(value.replace(/\D/g, "").slice(0, OTP_LENGTH));
                        if (errorMessage) setErrorMessage("");
                      }}
                      aria-label="One-time password"
                      inputMode="numeric"
                      containerClassName="w-full justify-center"
                    >
                      <InputOTPGroup className="w-full justify-center gap-1.5">
                        <InputOTPSlot index={0} className="h-11 w-9 rounded-xl border border-border bg-card text-sm font-semibold first:rounded-xl first:border last:rounded-xl" />
                        <InputOTPSlot index={1} className="h-11 w-9 rounded-xl border border-border bg-card text-sm font-semibold first:rounded-xl first:border last:rounded-xl" />
                        <InputOTPSlot index={2} className="h-11 w-9 rounded-xl border border-border bg-card text-sm font-semibold first:rounded-xl first:border last:rounded-xl" />
                        <InputOTPSlot index={3} className="h-11 w-9 rounded-xl border border-border bg-card text-sm font-semibold first:rounded-xl first:border last:rounded-xl" />
                        <InputOTPSlot index={4} className="h-11 w-9 rounded-xl border border-border bg-card text-sm font-semibold first:rounded-xl first:border last:rounded-xl" />
                        <InputOTPSlot index={5} className="h-11 w-9 rounded-xl border border-border bg-card text-sm font-semibold first:rounded-xl first:border last:rounded-xl" />
                      </InputOTPGroup>
                    </InputOTP>
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-2">
                  <button
                    type="submit"
                    disabled={isBusy}
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-secondary py-2.5 text-sm font-semibold text-secondary-foreground transition-all hover:opacity-90 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-70"
                  >
                    {isVerifyingOtp ? <LoadingSpinner className="h-4 w-4" /> : null}
                    <span>{isVerifyingOtp ? "Verifying OTP..." : "Verify OTP"}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => void handleSendOtp("resend")}
                    disabled={resendIn > 0 || isBusy}
                    className="inline-flex items-center justify-center gap-2 rounded-xl border border-border px-3 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-muted/50 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {isSendingOtp ? <LoadingSpinner className="h-3.5 w-3.5" /> : <RefreshCw className="h-3.5 w-3.5" />}
                    <span>{resendIn > 0 ? `${resendIn}s` : isSendingOtp ? "Sending..." : "Resend"}</span>
                  </button>
                </div>
              </section>
            ) : null}

            {step === "account" ? (
              <section className="rounded-3xl border border-secondary/20 bg-secondary/5 p-4 shadow-sm">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h2 className="text-lg font-display font-semibold text-foreground">Account</h2>
                    <p className="mt-1 text-sm text-muted-foreground">{normalizedEmail}</p>
                  </div>
                  <span className="inline-flex items-center gap-1 rounded-full bg-secondary/12 px-3 py-1 text-xs font-semibold text-secondary">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    Verified
                  </span>
                </div>

                <div className="mt-4 space-y-4">
                  <div>
                    <label htmlFor="signup-full-name" className="mb-1.5 block text-[15px] font-medium text-foreground">
                      Full name
                    </label>
                    <div className="relative">
                      <User className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <input
                        id="signup-full-name"
                        type="text"
                        value={fullName}
                        onChange={(event) => {
                          setFullName(event.target.value);
                          if (errorMessage) setErrorMessage("");
                        }}
                        className="w-full rounded-xl border border-border bg-background py-3 pl-10 pr-4 text-[15px] text-foreground transition-all placeholder:text-muted-foreground focus:border-transparent focus:outline-none focus:ring-2 focus:ring-ring"
                        placeholder="John Doe"
                        autoComplete="name"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="signup-username" className="mb-1.5 block text-[15px] font-medium text-foreground">
                      Username
                    </label>
                    <div className="relative">
                      <AtSign className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <input
                        id="signup-username"
                        type="text"
                        value={username}
                        onChange={(event) => {
                          setUsername(normalizeUsername(event.target.value));
                          if (errorMessage) setErrorMessage("");
                        }}
                        className="w-full rounded-xl border border-border bg-background py-3 pl-10 pr-4 text-[15px] text-foreground transition-all placeholder:text-muted-foreground focus:border-transparent focus:outline-none focus:ring-2 focus:ring-ring"
                        placeholder="john.doe"
                        autoComplete="username"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="signup-password" className="mb-1.5 block text-[15px] font-medium text-foreground">
                      Password
                    </label>
                    <div className="relative">
                      <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <input
                        id="signup-password"
                        type={showPass ? "text" : "password"}
                        value={password}
                        onChange={(event) => {
                          setPassword(event.target.value);
                          if (errorMessage) setErrorMessage("");
                        }}
                        className="w-full rounded-xl border border-border bg-background py-3 pl-10 pr-10 text-[15px] text-foreground transition-all placeholder:text-muted-foreground focus:border-transparent focus:outline-none focus:ring-2 focus:ring-ring"
                        placeholder="Min 8 characters"
                        autoComplete="new-password"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPass((current) => !current)}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
                      >
                        {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isBusy}
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-accent py-2.5 text-sm font-semibold text-accent-foreground shadow-sm transition-all hover:opacity-90 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-70"
                  >
                    {isCreatingAccount ? <LoadingSpinner className="h-4 w-4" /> : null}
                    <span>{isCreatingAccount ? "Creating account..." : "Create account"}</span>
                    {!isCreatingAccount ? <ArrowRight className="h-4 w-4" /> : null}
                  </button>
                </div>
              </section>
            ) : null}
          </form>

          <p className="mt-4 text-center text-[15px] text-muted-foreground">
            Already have an account?{" "}
            <Link to="/login" className="font-semibold text-secondary hover:underline">
              Sign in
            </Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
};

export default Signup;
