import { Link } from "react-router-dom";
import { MapPin } from "lucide-react";
import type { FreelancerSummary } from "@/lib/userApi";

const FreelancerCard = ({ freelancer }: { freelancer: FreelancerSummary }) => {
  return (
    <div className="rounded-2xl border border-border bg-card p-5 shadow-sm transition-all duration-300 group">
      <div className="flex items-start gap-4">
        <img
          src={freelancer.avatar}
          alt={freelancer.name}
          className="h-14 w-14 rounded-xl bg-muted object-cover flex-shrink-0"
        />
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <h3 className="font-display font-semibold text-foreground truncate">{freelancer.name}</h3>
            <span className="text-sm font-semibold text-secondary">
              {freelancer.hourlyRateMin > 0 || freelancer.hourlyRateMax > 0
                ? `USD ${freelancer.hourlyRateMin || freelancer.hourlyRateMax}${freelancer.hourlyRateMax > freelancer.hourlyRateMin ? `-${freelancer.hourlyRateMax}` : ""}/hr`
                : "Profile"}
            </span>
          </div>
          <p className="text-sm text-muted-foreground">{freelancer.title}</p>
          <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
            <MapPin className="h-3.5 w-3.5" />
            <span>{freelancer.location || "Location not set"}</span>
          </div>
        </div>
      </div>
      <p className="text-sm text-muted-foreground mt-3 line-clamp-2">{freelancer.bio}</p>
      <div className="flex flex-wrap gap-1.5 mt-3">
        {freelancer.skills.map((skill) => (
          <span
            key={skill}
            className="px-2.5 py-1 text-xs font-medium rounded-lg bg-secondary/10 text-secondary"
          >
            {skill}
          </span>
        ))}
      </div>
      <Link
        to={`/profile/${freelancer.userId}`}
        className="mt-4 inline-flex w-full items-center justify-center rounded-[10px] bg-gradient-to-r from-primary to-accent px-4 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-85"
      >
        View Details
      </Link>
    </div>
  );
};

export default FreelancerCard;
