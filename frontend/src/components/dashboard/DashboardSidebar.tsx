import { Link, useLocation } from "react-router-dom";
import {
  Briefcase,
  FileText,
  LayoutDashboard,
  Lock,
  MessageSquareText,
  PlusCircle,
  Settings,
  UserCircle2,
  Users,
  Bookmark,
  Zap,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";

interface DashboardSidebarProps {
  onLinkClick?: () => void;
  forceNavMode?: boolean;
  embedded?: boolean;
}

export const DashboardSidebar = ({ onLinkClick, embedded }: DashboardSidebarProps) => {
  const { user } = useAuth();
  const location = useLocation();

  if (!user) return null;

  const isFreelancer = user.role === "freelancer";
  const isIncompleteFreelancer = isFreelancer && !user.profile_completed;
  const hirerBasePath = location.pathname.startsWith("/client-dashboard") ? "/client-dashboard" : "/dashboard";
  const dashboardBasePath = isFreelancer ? "/dashboard" : hirerBasePath;

  const freelancerItems = [
    { label: "Dashboard", icon: LayoutDashboard, path: "/dashboard" },
    { label: "Find Works", icon: Briefcase, path: "/dashboard/find-work", requiresProfileComplete: true },
    { label: "Applied Works", icon: FileText, path: "/dashboard/applications", requiresProfileComplete: true },
    { label: "Saved Jobs", icon: Bookmark, path: "/dashboard/saved", requiresProfileComplete: true },
    { label: "Messages", icon: MessageSquareText, path: "/dashboard/messages" },
    { label: "Profile", icon: UserCircle2, path: "/profile" },
    { label: "Settings", icon: Settings, path: "/dashboard/settings" },
  ];

  const hirerItems = [
    { label: "Dashboard", icon: LayoutDashboard, path: hirerBasePath },
    { label: "Find Talent", icon: Users, path: `${hirerBasePath}/talent` },
    { label: "My Jobs", icon: Briefcase, path: `${hirerBasePath}/my-jobs` },
    { label: "Post a Job", icon: PlusCircle, path: `${hirerBasePath}/post-job` },
    { label: "Messages", icon: MessageSquareText, path: `${hirerBasePath}/messages` },
    { label: "Profile", icon: UserCircle2, path: `${hirerBasePath}/profile` },
    { label: "Settings", icon: Settings, path: `${hirerBasePath}/settings` },
  ];

  const navItems = isFreelancer ? freelancerItems : hirerItems;
  const isActive = (path: string) =>
    path === dashboardBasePath ? location.pathname === dashboardBasePath : location.pathname.startsWith(path);

  const Wrapper = embedded ? "div" : "aside";
  const wrapperClass = embedded
    ? "flex h-full w-full flex-col border-r border-white/10 bg-[#151c2f]"
    : "fixed inset-y-0 left-0 z-30 hidden w-[246px] flex-col border-r border-white/10 bg-[#151c2f] lg:flex";

  return (
    <Wrapper className={wrapperClass}>
      <div className="flex h-full flex-col">
        <div className="flex items-center gap-3 border-b border-white/10 px-6 py-5">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#19b2a6] shadow-[0_12px_30px_-18px_rgba(25,178,166,0.85)]">
            <Zap className="h-5 w-5 text-white" />
          </div>
          <div>
            <p className="text-lg font-display font-semibold tracking-[0.01em] text-white">ProConnect</p>
            <p className="text-xs text-white/55">{isFreelancer ? "Freelancer Workspace" : "Client Workspace"}</p>
          </div>
        </div>

        <div className="px-4 pt-6">
          <p className="px-3 text-[11px] font-semibold uppercase tracking-[0.24em] text-white/45">Navigation</p>
        </div>

        <nav className="flex-1 space-y-1.5 px-4 py-4">
          {navItems.map((item) => {
            const locked = isIncompleteFreelancer && !!item.requiresProfileComplete;
            const baseClass = cn(
              "group flex items-center justify-between rounded-xl px-3.5 py-3 text-sm font-medium transition-all duration-200",
              isActive(item.path)
                ? "bg-gradient-to-r from-[#ff9b54] to-[#f97316] text-white shadow-[0_16px_38px_-22px_rgba(249,115,22,0.9)]"
                : "text-white/72 hover:bg-white/6 hover:text-white"
            );

            const content = (
              <>
                <div className="flex min-w-0 items-center gap-3">
                  <item.icon className={cn("h-[18px] w-[18px] shrink-0", isActive(item.path) ? "text-white" : "text-white/70")} />
                  <span className="truncate">{item.label}</span>
                </div>
                {locked && <Lock className="h-3.5 w-3.5 text-white/55" />}
              </>
            );

            if (locked) {
              return (
                <div
                  key={item.path}
                  className={cn(baseClass, "cursor-not-allowed opacity-55")}
                  aria-disabled="true"
                  title="Complete your profile to unlock"
                >
                  {content}
                </div>
              );
            }

            return (
              <Link key={item.path} to={item.path} onClick={onLinkClick} className={baseClass}>
                {content}
              </Link>
            );
          })}
        </nav>

        {isFreelancer ? (
          <div className="border-t border-white/10 p-4">
            <div className="rounded-2xl bg-white/6 p-4">
              <p className="text-sm font-semibold text-white">Keep your profile active</p>
              <p className="mt-2 text-xs leading-6 text-white/60">
                Updated portfolios and skills help clients trust your profile faster.
              </p>
              <Link
                to="/profile-completion"
                onClick={onLinkClick}
                className="mt-4 inline-flex rounded-[10px] bg-accent px-3.5 py-2 text-sm font-semibold text-white transition hover:bg-accent/90"
              >
                {user.profile_completed ? "Update Profile" : "Complete Profile"}
              </Link>
            </div>
          </div>
        ) : (
          <div className="border-t border-white/10 p-4">
            <div className="rounded-2xl bg-white/6 p-4">
              <p className="text-sm font-semibold text-white">Keep your client profile current</p>
              <p className="mt-2 text-xs leading-6 text-white/60">
                Clear budgets, hiring focus, and verification details help freelancers respond with better-fit proposals.
              </p>
              <Link
                to="/client-profile-completion"
                onClick={onLinkClick}
                className="mt-4 inline-flex rounded-[10px] bg-accent px-3.5 py-2 text-sm font-semibold text-white transition hover:bg-accent/90"
              >
                {user.client_profile_completed ? "Update Profile" : "Complete Profile"}
              </Link>
            </div>
          </div>
        )}
      </div>
    </Wrapper>
  );
};
