import { ArrowLeft, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface ProfileEditorStep {
  step: number;
  label: string;
}

interface ProfileEditorFrameProps {
  roleLabel: string;
  summary: string;
  backLabel: string;
  onBack: () => void;
  currentStep: number;
  completionPercent: number;
  steps: ProfileEditorStep[];
  canOpenStep: (step: number) => boolean;
  isStepComplete: (step: number) => boolean;
  onStepClick: (step: number) => void;
  children: React.ReactNode;
  footer: React.ReactNode;
}

const ProfileEditorFrame = ({
  roleLabel,
  summary,
  backLabel,
  onBack,
  currentStep,
  completionPercent,
  steps,
  canOpenStep,
  isStepComplete,
  onStepClick,
  children,
  footer,
}: ProfileEditorFrameProps) => {
  return (
    <div className="relative min-h-[100dvh] overflow-hidden bg-[#01040b] text-foreground">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(73,94,156,0.34),transparent_28%),radial-gradient(circle_at_top,rgba(18,34,72,0.28),transparent_42%),linear-gradient(180deg,#060a14_0%,#030711_52%,#010309_100%)]" />
      <div className="pointer-events-none absolute inset-0 opacity-35 [background-image:linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] [background-size:120px_120px]" />

      <div className="relative mx-auto flex min-h-[100dvh] max-w-[1380px] flex-col px-4 py-4 sm:px-6 lg:px-8">
        <header className="shrink-0">
          <button
            type="button"
            onClick={onBack}
            className="inline-flex h-11 items-center gap-2 rounded-[10px] border border-[#ff9e43]/40 bg-gradient-to-r from-[#f28c28] to-[#ff9e43] px-4 text-sm font-semibold text-white shadow-[0_14px_30px_-18px_rgba(242,140,40,0.75)] transition hover:brightness-110"
          >
            <ArrowLeft className="h-4 w-4" />
            {backLabel}
          </button>
        </header>

        <div className="mt-5 grid flex-1 gap-6 lg:grid-cols-[310px_minmax(0,1fr)]">
          <aside className="min-h-0">
            <div className="lg:sticky lg:top-5">
              <div className="overflow-hidden rounded-[30px] border border-white/10 bg-[linear-gradient(180deg,rgba(9,14,24,0.92)_0%,rgba(4,8,16,0.96)_100%)] p-5 shadow-[0_40px_120px_-70px_rgba(0,0,0,0.95)] backdrop-blur">
                <p className="text-[0.7rem] font-semibold uppercase tracking-[0.28em] text-white/42">{roleLabel}</p>
                <h2 className="mt-4 font-display text-[1.5rem] font-semibold leading-tight text-white">Profile Setup</h2>
                <p className="mt-3 text-sm leading-6 text-white/55">{summary}</p>

                <div className="mt-6 rounded-[22px] border border-white/10 bg-white/[0.03] p-4">
                  <div className="flex items-end justify-between gap-3">
                    <div>
                      <p className="text-[0.68rem] font-semibold uppercase tracking-[0.24em] text-white/40">Progress</p>
                      <p className="mt-2 font-display text-[2.2rem] leading-none text-white">{completionPercent}%</p>
                    </div>
                    <div className="rounded-full border border-[#f28c28]/30 bg-[#f28c28]/10 px-3 py-1 text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-[#ffb15a]">
                      Step {currentStep}/{steps.length}
                    </div>
                  </div>

                  <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/8">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-[#f28c28] to-[#ffb15a] transition-all duration-300"
                      style={{ width: `${completionPercent}%` }}
                    />
                  </div>
                </div>

                <div className="mt-6 space-y-2">
                  {steps.map((stepMeta) => {
                    const isActive = currentStep === stepMeta.step;
                    const isComplete = isStepComplete(stepMeta.step);
                    const isEnabled = canOpenStep(stepMeta.step);

                    return (
                      <button
                        key={stepMeta.step}
                        type="button"
                        onClick={() => isEnabled && onStepClick(stepMeta.step)}
                        className={cn(
                          "flex w-full items-center gap-3 rounded-[18px] border px-4 py-3 text-left transition",
                          isEnabled ? "cursor-pointer" : "cursor-not-allowed opacity-45",
                          isActive
                            ? "border-[#f28c28]/45 bg-[#f28c28]/10 shadow-[0_12px_30px_-20px_rgba(242,140,40,0.85)]"
                            : isComplete
                              ? "border-emerald-400/20 bg-emerald-400/[0.07]"
                              : "border-white/10 bg-white/[0.02] hover:border-white/16 hover:bg-white/[0.04]"
                        )}
                      >
                        <span
                          className={cn(
                            "flex h-9 w-9 shrink-0 items-center justify-center rounded-full border text-sm font-semibold",
                            isActive
                              ? "border-[#f28c28]/50 bg-[#f28c28]/12 text-[#ffb15a]"
                              : isComplete
                                ? "border-emerald-400/30 bg-emerald-400/[0.12] text-emerald-300"
                                : "border-white/12 bg-white/[0.03] text-white/72"
                          )}
                        >
                          {isComplete && !isActive ? <CheckCircle2 className="h-4 w-4" /> : stepMeta.step}
                        </span>

                        <div className="min-w-0">
                          <p className="text-[0.64rem] font-semibold uppercase tracking-[0.22em] text-white/34">
                            {isComplete && !isActive ? "Completed" : `Step ${stepMeta.step}`}
                          </p>
                          <p className="mt-1 truncate text-sm font-semibold text-white">{stepMeta.label}</p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </aside>

          <main className="min-h-0">
            <div className="flex min-h-full flex-col overflow-hidden rounded-[32px] border border-white/10 bg-[linear-gradient(180deg,rgba(8,13,22,0.9)_0%,rgba(3,7,14,0.96)_100%)] shadow-[0_40px_140px_-80px_rgba(0,0,0,0.98)] backdrop-blur">
              <div className="min-h-0 flex-1 overflow-y-auto px-5 py-6 sm:px-8 sm:py-8 lg:px-10 lg:py-9">
                <div className="mx-auto w-full max-w-[880px]">{children}</div>
              </div>

              <div className="shrink-0 border-t border-white/10 bg-black/15 px-5 py-4 sm:px-8">{footer}</div>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
};

export default ProfileEditorFrame;
