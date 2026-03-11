import { Briefcase, Building2, ChevronDown, CircleUserRound, MapPin, Sparkles } from "lucide-react";
import type { ClientProfileData } from "@/types/clientProfileCompletion";
import type { ProfileData } from "@/types/profileCompletion";

interface WizardPreviewPaneProps {
  role: "freelancer" | "client";
  currentStep: number;
  completionPercent: number;
  freelancerProfile?: ProfileData;
  clientProfile?: ClientProfileData;
}

const WizardPreviewPane = ({
  role,
  currentStep,
  completionPercent,
  freelancerProfile,
  clientProfile,
}: WizardPreviewPaneProps) => {
  const previewBody =
    role === "freelancer" ? (
      <div className="space-y-3">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-[4px] bg-primary/15 text-primary">
            <CircleUserRound className="h-5 w-5" />
          </div>
          <div>
            <p className="font-semibold text-foreground">{freelancerProfile?.personal.name || "Your Name"}</p>
            <p className="text-xs text-muted-foreground">
              {freelancerProfile?.professional.specializations[0] ||
                freelancerProfile?.professional.domains[0] ||
                "Professional headline"}
            </p>
          </div>
        </div>
        <p className="text-xs text-muted-foreground">
          {[freelancerProfile?.personal.city, freelancerProfile?.personal.country].filter(Boolean).join(", ") ||
            "Add your location"}
        </p>
        <div className="flex flex-wrap gap-1.5">
          {(freelancerProfile?.skills ?? []).slice(0, 4).map((skill) => (
            <span key={skill} className="rounded-[4px] bg-primary/10 px-2 py-0.5 text-[11px] text-primary">
              {skill}
            </span>
          ))}
          {(freelancerProfile?.skills ?? []).length === 0 && (
            <span className="text-xs text-muted-foreground">Skills preview appears here.</span>
          )}
        </div>
        <div className="grid grid-cols-2 gap-2 pt-1">
          <div className="rounded-[4px] border border-border bg-muted/20 p-2">
            <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Projects</p>
            <p className="text-sm font-semibold text-foreground">{freelancerProfile?.projects.length ?? 0}</p>
          </div>
          <div className="rounded-[4px] border border-border bg-muted/20 p-2">
            <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Hourly</p>
            <p className="text-sm font-semibold text-foreground">
              {freelancerProfile?.rates.hourly
                ? `${freelancerProfile.rates.currency || "USD"} ${freelancerProfile.rates.hourly}`
                : "Add rate"}
            </p>
          </div>
        </div>
      </div>
    ) : (
      <div className="space-y-3">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-[4px] bg-primary/15 text-primary">
            <Building2 className="h-5 w-5" />
          </div>
          <div>
            <p className="font-semibold text-foreground">
              {clientProfile?.basic.companyName ||
                clientProfile?.basic.fullName ||
                "Hiring Profile"}
            </p>
            <p className="text-xs text-muted-foreground">
              {clientProfile?.basic.professionalTitle || "Client profile headline"}
            </p>
          </div>
        </div>
        <p className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
          <MapPin className="h-3.5 w-3.5" />
          {[clientProfile?.contact.city, clientProfile?.contact.country].filter(Boolean).join(", ") || "Set your location"}
        </p>
        <div>
          <p className="mb-1 text-[11px] uppercase tracking-wide text-muted-foreground">Hiring focus</p>
          <div className="flex flex-wrap gap-1.5">
            {(clientProfile?.hiring.skills ?? []).slice(0, 3).map((skill) => (
              <span key={skill} className="rounded-[4px] bg-primary/10 px-2 py-0.5 text-[11px] text-primary">
                {skill}
              </span>
            ))}
            {(clientProfile?.hiring.skills ?? []).length === 0 && (
              <span className="text-xs text-muted-foreground">Selected skills appear here.</span>
            )}
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2 pt-1">
          <div className="rounded-[4px] border border-border bg-muted/20 p-2">
            <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Past projects</p>
            <p className="text-sm font-semibold text-foreground">{clientProfile?.projects.projects.length ?? 0}</p>
          </div>
          <div className="rounded-[4px] border border-border bg-muted/20 p-2">
            <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Payment setup</p>
            <p className="text-sm font-semibold text-foreground">
              {clientProfile?.verification.paymentVerified ? "Verified" : "Pending"}
            </p>
          </div>
        </div>
      </div>
    );

  return (
    <>
      <aside className="hidden h-fit rounded-[4px] border border-border bg-card p-4 card-shadow lg:block">
        <div className="mb-3 flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary" />
          <p className="text-sm font-semibold text-foreground">Live Preview</p>
        </div>
        <p className="mb-3 text-xs text-muted-foreground">
          Step {currentStep} • {completionPercent}% complete
        </p>
        {previewBody}
      </aside>

      <details className="rounded-[4px] border border-border bg-card card-shadow lg:hidden">
        <summary className="flex cursor-pointer list-none items-center justify-between px-3 py-2 text-sm font-semibold text-foreground">
          <span className="inline-flex items-center gap-2">
            <Briefcase className="h-4 w-4 text-primary" />
            Preview
          </span>
          <ChevronDown className="h-4 w-4 text-muted-foreground" />
        </summary>
        <div className="border-t border-border p-3">{previewBody}</div>
      </details>
    </>
  );
};

export default WizardPreviewPane;
