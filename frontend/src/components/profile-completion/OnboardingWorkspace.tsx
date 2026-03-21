import type { ReactNode } from "react";
import { ArrowLeft } from "lucide-react";

interface OnboardingWorkspaceProps {
  backLabel: string;
  onBack: () => void;
  children: ReactNode;
  footer?: ReactNode;
  showHeaderBack?: boolean;
}

const OnboardingWorkspace = ({ backLabel, onBack, children, footer, showHeaderBack = true }: OnboardingWorkspaceProps) => {
  return (
    <div className="relative min-h-[100dvh] overflow-hidden">
      {/* Animated background orbs */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="orb orb-float-slow absolute -left-40 top-1/4 h-[500px] w-[500px] bg-[hsl(250,60%,20%)] opacity-25" />
        <div className="orb orb-float-medium absolute -right-32 bottom-0 h-[400px] w-[400px] bg-[hsl(170,60%,18%)] opacity-20" />
      </div>

      <div className="relative mx-auto flex min-h-[100dvh] max-w-6xl flex-col px-4 py-4 sm:px-6 sm:py-5 lg:px-8">
        {showHeaderBack ? (
          <div className="flex items-center justify-start">
            <button
              type="button"
              onClick={onBack}
              className="inline-flex h-11 items-center gap-2 rounded-full border border-border bg-card px-4 text-sm font-semibold text-foreground transition hover:border-secondary/40 hover:text-foreground focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-secondary/12"
            >
              <ArrowLeft className="h-4 w-4" />
              {backLabel}
            </button>
          </div>
        ) : null}

        <main className="flex flex-1 items-start justify-center py-4 sm:py-6">{children}</main>

        {footer ? <div className="pt-4 pb-4 sm:pb-5">{footer}</div> : null}
      </div>
    </div>
  );
};

export default OnboardingWorkspace;
