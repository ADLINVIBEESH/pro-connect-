import { CheckCircle2, ChevronLeft, ChevronRight, Save } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import type { WizardStep } from "@/types/profileCompletion";
import { cn } from "@/lib/utils";

export interface WizardStepMeta {
  step: WizardStep;
  label: string;
  weight?: number;
}

interface WizardShellProps {
  title: string;
  subtitle: string;
  completionPercent: number;
  currentStep: WizardStep;
  steps: WizardStepMeta[];
  canGoToStep: (step: WizardStep) => boolean;
  isStepComplete: (step: WizardStep) => boolean;
  onStepChange: (step: WizardStep) => void;
  onBack: () => void;
  onSaveAndExit: () => void;
  onSkip: () => void;
  onNext: () => void;
  nextLabel?: string;
  disableNext?: boolean;
  disableBack?: boolean;
  children: React.ReactNode;
  preview?: React.ReactNode;
}

const WizardShell = ({
  title,
  subtitle,
  completionPercent,
  currentStep,
  steps,
  canGoToStep,
  isStepComplete,
  onStepChange,
  onBack,
  onSaveAndExit,
  onSkip,
  onNext,
  nextLabel,
  disableNext,
  disableBack,
  children,
  preview,
}: WizardShellProps) => {
  return (
    <div className="mx-auto flex min-h-[calc(100vh-7rem)] max-w-6xl items-start justify-center py-2 lg:items-center lg:py-3">
      <div className="grid w-full gap-4 lg:grid-cols-[minmax(0,1fr)_280px]">
        <div className="w-full rounded-[4px] border border-border bg-card p-4 card-shadow lg:p-5">
          <div className="space-y-4">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                  Profile Onboarding
                </p>
                <h1 className="mt-1 text-xl font-display font-semibold text-foreground lg:text-2xl">{title}</h1>
                <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
              </div>
              <div className="flex flex-col items-end gap-2">
                <span className="inline-flex items-center gap-2 rounded-[4px] bg-primary/15 px-3 py-1.5 text-xs font-semibold text-primary">
                  <CheckCircle2 className="h-4 w-4" />
                  {completionPercent}% Complete
                </span>
                <p className="text-[11px] text-muted-foreground">
                  Step {currentStep} of {steps.length}
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>Overall progress</span>
                <span>{completionPercent}%</span>
              </div>
              <Progress value={completionPercent} className="h-2 bg-muted" />
            </div>

            <div className="grid grid-cols-2 gap-2 lg:grid-cols-5">
              {steps.map((stepMeta) => {
                const done = isStepComplete(stepMeta.step);
                const active = currentStep === stepMeta.step;
                const enabled = canGoToStep(stepMeta.step);
                return (
                  <button
                    key={stepMeta.step}
                    type="button"
                    onClick={() => enabled && onStepChange(stepMeta.step)}
                    className={cn(
                      "rounded-[4px] border px-3 py-2 text-left transition-colors",
                      enabled ? "cursor-pointer" : "cursor-not-allowed opacity-70",
                      active
                        ? "border-primary bg-primary/10"
                        : done
                          ? "border-primary/30 bg-primary/5 hover:bg-primary/10"
                          : "border-border bg-muted/30"
                    )}
                  >
                    <p className="text-xs text-muted-foreground">Step {stepMeta.step}</p>
                    <p className="truncate text-sm font-semibold text-foreground">{stepMeta.label}</p>
                    {typeof stepMeta.weight === "number" && (
                      <p className="text-[11px] text-muted-foreground">{stepMeta.weight}% weight</p>
                    )}
                  </button>
                );
              })}
            </div>

            <div className="pt-1">{children}</div>

            <div className="mt-7 flex flex-col gap-3 border-t border-border pt-5 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={onBack}
                  disabled={disableBack}
                  className="dashboard-btn-outline disabled:opacity-50"
                >
                  <ChevronLeft className="h-4 w-4" />
                  Back
                </button>
                <button type="button" onClick={onSaveAndExit} className="dashboard-btn-outline">
                  <Save className="h-4 w-4" />
                  Save & Exit
                </button>
                <button type="button" onClick={onSkip} className="dashboard-btn-outline">
                  Skip for now
                </button>
              </div>

              <button
                type="button"
                onClick={onNext}
                disabled={disableNext}
                className="dashboard-btn-primary disabled:opacity-50"
              >
                {nextLabel ?? (currentStep === 5 ? "Complete" : "Next")}
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

        {preview}
      </div>
    </div>
  );
};

export default WizardShell;
