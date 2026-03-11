import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Zap, Bell, User, LogOut, ChevronDown, Search } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { fetchMyJobsRequest } from "@/lib/networkApi";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type DashboardNavItem = {
  label: string;
  path: string;
  requiresProfileComplete?: boolean;
};

const getDashboardNavItems = (role: "freelancer" | "client"): DashboardNavItem[] =>
  role === "freelancer"
    ? [
        { label: "Dashboard", path: "/dashboard" },
        { label: "Find Work", path: "/dashboard/find-work", requiresProfileComplete: true },
        { label: "Applied Works", path: "/dashboard/applications", requiresProfileComplete: true },
        { label: "Saved Jobs", path: "/dashboard/saved", requiresProfileComplete: true },
        { label: "Messages", path: "/dashboard/messages" },
        { label: "Profile", path: "/profile" },
        { label: "Settings", path: "/dashboard/settings" },
      ]
    : [];

const getClientNavItems = (basePath: string): DashboardNavItem[] => [
  { label: "Dashboard", path: basePath },
  { label: "Find Talent", path: `${basePath}/talent` },
  { label: "My Jobs", path: `${basePath}/my-jobs` },
  { label: "Post a Job", path: `${basePath}/post-job` },
  { label: "Messages", path: `${basePath}/messages` },
  { label: "Profile", path: `${basePath}/profile` },
  { label: "Settings", path: `${basePath}/settings` },
];

const NotificationBell = ({ dashboardBasePath }: { dashboardBasePath: string }) => {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const notificationsQuery = useQuery({
    queryKey: ["my-jobs", "notifications"],
    queryFn: () => fetchMyJobsRequest(true),
    enabled: user?.role === "client",
  });

  const notifications = useMemo(() => {
    if (user?.role !== "client") {
      return [];
    }

    return (notificationsQuery.data?.jobs ?? [])
      .flatMap((job) =>
        (job.applications ?? []).map((application) => ({
          id: application.id,
          title: job.title,
          jobId: job.id,
          freelancerName: application.freelancerName,
          freelancerAvatar: application.freelancerAvatar,
          createdAt: application.createdAt,
        })),
      )
      .sort((a, b) => new Date(b.createdAt ?? 0).getTime() - new Date(a.createdAt ?? 0).getTime())
      .slice(0, 12);
  }, [notificationsQuery.data?.jobs, user?.role]);

  if (!user) return null;

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((current) => !current)}
        className="relative inline-flex h-9 w-9 items-center justify-center rounded-full text-muted-foreground transition-colors hover:text-foreground"
      >
        <Bell className="h-[18px] w-[18px]" />
        {notifications.length > 0 ? (
          <span className="absolute -right-1 -top-1 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-semibold text-destructive-foreground">
            {notifications.length > 9 ? "9+" : notifications.length}
          </span>
        ) : null}
      </button>

      <AnimatePresence>
        {open ? (
          <motion.div
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 4 }}
            transition={{ duration: 0.16 }}
            className="dashboard-scroll absolute right-0 top-full z-50 mt-3 max-h-[24rem] w-[22rem] overflow-y-auto rounded-[14px] border border-border bg-card shadow-[0_24px_60px_-38px_rgba(0,0,0,0.72)]"
          >
            <div className="border-b border-border px-3 py-2.5">
              <h4 className="text-sm font-semibold text-foreground">Notifications</h4>
            </div>

            {notificationsQuery.isLoading ? <p className="p-4 text-center text-sm text-muted-foreground">Loading notifications...</p> : null}

            {notificationsQuery.isError ? (
              <p className="p-4 text-center text-sm text-destructive">
                {notificationsQuery.error instanceof Error ? notificationsQuery.error.message : "Unable to load notifications."}
              </p>
            ) : null}

            {!notificationsQuery.isLoading && !notificationsQuery.isError && notifications.length === 0 ? (
              <p className="p-4 text-center text-sm text-muted-foreground">No notifications yet.</p>
            ) : null}

            {!notificationsQuery.isLoading && !notificationsQuery.isError && notifications.length > 0 ? (
              <div className="divide-y divide-border">
                {notifications.map((notification) => (
                  <button
                    key={notification.id}
                    onClick={() => {
                      setOpen(false);
                      navigate(`${dashboardBasePath}/job/${notification.jobId}`);
                    }}
                    className="w-full p-3 text-left transition-colors hover:bg-muted/35"
                  >
                    <div className="flex items-start gap-2.5">
                      <img src={notification.freelancerAvatar} alt="" className="h-8 w-8 rounded-[6px] bg-muted object-cover shrink-0" />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm text-foreground">
                          <span className="font-medium">{notification.freelancerName}</span> applied for{" "}
                          <span className="font-medium">{notification.title}</span>
                        </p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {notification.createdAt ? new Date(notification.createdAt).toLocaleString() : "Recently"}
                        </p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            ) : null}
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
};

export const DashboardTopbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [jobSearch, setJobSearch] = useState("");
  const clientBasePath = location.pathname.startsWith("/client-dashboard") ? "/client-dashboard" : "/dashboard";
  const dashboardBasePath = user?.role === "client" ? clientBasePath : "/dashboard";
  const profilePath = user?.role === "freelancer" ? "/profile" : `${clientBasePath}/profile`;
  const profileLabel = user?.role === "freelancer" ? "View Profile" : "Profile";

  useEffect(() => {
    const searchValue = new URLSearchParams(location.search).get("search") ?? "";
    setJobSearch(searchValue);
  }, [location.search]);

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const handleSearchSubmit = (event: React.FormEvent) => {
    event.preventDefault();

    if (user?.role !== "freelancer") {
      navigate(`${clientBasePath}/my-jobs`);
      return;
    }

    const trimmed = jobSearch.trim();
    navigate(trimmed ? `/dashboard/find-work?search=${encodeURIComponent(trimmed)}` : "/dashboard/find-work");
  };

  if (!user) return null;

  const isIncompleteFreelancer = user.role === "freelancer" && !user.profile_completed;
  const navItems = user.role === "freelancer" ? getDashboardNavItems(user.role) : getClientNavItems(clientBasePath);
  const isActive = (path: string) =>
    path === dashboardBasePath ? location.pathname === dashboardBasePath : location.pathname.startsWith(path);

  return (
    <header className="sticky top-0 z-20 border-b border-border bg-background/92 backdrop-blur-sm">
      <div className="mx-auto flex max-w-[1520px] flex-col gap-3 px-4 py-3 lg:px-8 lg:py-3.5">
        <div className="flex flex-wrap items-center gap-3 xl:flex-nowrap">
          <Link to={dashboardBasePath} className="flex shrink-0 items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-secondary shadow-[0_14px_32px_-20px_rgba(25,178,166,0.62)]">
              <Zap className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="font-display text-[1.55rem] leading-none tracking-[0.02em] text-foreground">ProConnect</p>
              <p className="mt-1 font-display text-[0.82rem] leading-none text-muted-foreground">
                {user.role === "freelancer" ? "Freelancer Workspace" : "Client Workspace"}
              </p>
            </div>
          </Link>

          <nav className="order-3 w-full min-w-0 xl:order-none xl:flex-1">
            <div className="dashboard-scroll flex items-center gap-1 overflow-x-auto whitespace-nowrap px-1 xl:justify-center">
              {navItems.map((item) => {
                const locked = isIncompleteFreelancer && !!item.requiresProfileComplete;
                const navClass = cn(
                  "inline-flex h-9 shrink-0 items-center rounded-full px-3 text-[0.94rem] font-display leading-none transition-colors",
                  isActive(item.path) ? "bg-foreground text-background" : "text-muted-foreground hover:text-foreground",
                  locked && "cursor-not-allowed text-muted-foreground/45 hover:text-muted-foreground/45",
                );

                if (locked) {
                  return (
                    <div key={item.path} className={navClass} title="Complete your profile to unlock" aria-disabled="true">
                      <span>{item.label}</span>
                    </div>
                  );
                }

                return (
                  <Link key={item.path} to={item.path} className={navClass}>
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </div>
          </nav>

          <div className="ml-auto flex shrink-0 items-center gap-1 sm:gap-2">
            <NotificationBell dashboardBasePath={dashboardBasePath} />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-2.5 text-foreground transition-colors hover:text-foreground focus:outline-none focus:ring-2 focus:ring-accent/20">
                  <img src={user.avatar} alt={user.name} className="h-10 w-10 rounded-full object-cover" />
                  <div className="hidden text-left sm:block">
                    <p className="font-display text-[0.98rem] leading-none text-foreground">{user.name}</p>
                    <p className="mt-1 font-display text-[0.8rem] leading-none text-muted-foreground">
                      {user.role === "freelancer" ? "Freelancer" : "Client"}
                    </p>
                  </div>
                  <ChevronDown className="hidden h-4 w-4 text-muted-foreground sm:block" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48 rounded-[12px] border border-border bg-popover text-popover-foreground">
                <DropdownMenuItem asChild>
                  <Link to={profilePath}>
                    <User className="mr-2 h-4 w-4" />
                    {profileLabel}
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleLogout} className="text-destructive focus:text-destructive">
                  <LogOut className="mr-2 h-4 w-4" />
                  Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        <form onSubmit={handleSearchSubmit}>
          <label className="relative block">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              value={jobSearch}
              onChange={(event) => setJobSearch(event.target.value)}
              placeholder={user.role === "freelancer" ? "Search for jobs" : "Search dashboard"}
              className="h-11 w-full rounded-[4px] border border-border bg-card pl-10 pr-4 text-[0.96rem] font-display text-foreground outline-none transition placeholder:text-muted-foreground focus:border-accent/70 focus:ring-4 focus:ring-accent/10"
            />
          </label>
        </form>
      </div>
    </header>
  );
};
