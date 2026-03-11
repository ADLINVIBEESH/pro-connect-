import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Search } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import FreelancerCard from "@/components/dashboard/FreelancerCard";
import { fetchFreelancersRequest } from "@/lib/userApi";

const FindTalent = () => {
  const { user } = useAuth();
  const [search, setSearch] = useState("");
  const [selectedDomain, setSelectedDomain] = useState("");
  const [selectedSkill, setSelectedSkill] = useState("");
  const freelancersQuery = useQuery({
    queryKey: ["freelancers"],
    queryFn: fetchFreelancersRequest,
  });

  const clientDomains = user?.client_profile?.hiring.domains ?? [];
  const clientSubdomains = user?.client_profile?.hiring.subdomains ?? [];
  const clientSkills = user?.client_profile?.hiring.skills ?? [];

  const domainOptions = useMemo(() => {
    const values = new Set<string>();
    freelancersQuery.data?.freelancers.forEach((freelancer) => {
      freelancer.domains.forEach((domain) => values.add(domain));
    });
    return Array.from(values).sort((a, b) => a.localeCompare(b));
  }, [freelancersQuery.data?.freelancers]);

  const skillOptions = useMemo(() => {
    const values = new Set<string>();
    freelancersQuery.data?.freelancers.forEach((freelancer) => {
      freelancer.skills.forEach((skill) => values.add(skill));
    });
    return Array.from(values).sort((a, b) => a.localeCompare(b));
  }, [freelancersQuery.data?.freelancers]);

  const freelancers = useMemo(() => {
    const allFreelancers = freelancersQuery.data?.freelancers ?? [];
    const normalizedSearch = search.trim().toLowerCase();

    return [...allFreelancers]
      .map((freelancer) => {
        let relevanceScore = 0;

        relevanceScore += freelancer.domains.filter((domain) =>
          clientDomains.some((clientDomain) => clientDomain.toLowerCase() === domain.toLowerCase()),
        ).length * 3;

        relevanceScore += freelancer.subdomains.filter((subdomain) =>
          clientSubdomains.some((clientSubdomain) => clientSubdomain.toLowerCase() === subdomain.toLowerCase()),
        ).length * 2;

        relevanceScore += freelancer.skills.filter((skill) =>
          clientSkills.some((clientSkill) => clientSkill.toLowerCase() === skill.toLowerCase()),
        ).length;

        return {
          ...freelancer,
          relevanceScore,
        };
      })
      .filter((freelancer) => {
        if (selectedDomain && !freelancer.domains.some((domain) => domain.toLowerCase() === selectedDomain.toLowerCase())) {
          return false;
        }

        if (selectedSkill && !freelancer.skills.some((skill) => skill.toLowerCase() === selectedSkill.toLowerCase())) {
          return false;
        }

        if (!normalizedSearch) {
          return true;
        }

        return (
          freelancer.name.toLowerCase().includes(normalizedSearch) ||
          freelancer.title.toLowerCase().includes(normalizedSearch) ||
          freelancer.bio.toLowerCase().includes(normalizedSearch) ||
          freelancer.domains.some((domain) => domain.toLowerCase().includes(normalizedSearch)) ||
          freelancer.subdomains.some((subdomain) => subdomain.toLowerCase().includes(normalizedSearch)) ||
          freelancer.skills.some((skill) => skill.toLowerCase().includes(normalizedSearch))
        );
      })
      .sort((a, b) => {
        if (b.relevanceScore !== a.relevanceScore) {
          return b.relevanceScore - a.relevanceScore;
        }

        return new Date(b.updatedAt ?? b.createdAt ?? 0).getTime() - new Date(a.updatedAt ?? a.createdAt ?? 0).getTime();
      });
  }, [clientDomains, clientSkills, clientSubdomains, freelancersQuery.data?.freelancers, search, selectedDomain, selectedSkill]);

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-display font-semibold text-foreground">Find Talent</h1>
        <p className="text-sm text-muted-foreground">
          Browse freelancer profiles from MongoDB. Matching domains, subdomains, and skills are ranked higher.
        </p>
      </div>

      <div className="mb-5 grid gap-3 lg:grid-cols-[minmax(0,1fr)_220px_220px]">
        <label className="relative block">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            className="dashboard-input pl-9"
            placeholder="Search by name, domain, subdomain, or skill"
          />
        </label>

        <select value={selectedDomain} onChange={(event) => setSelectedDomain(event.target.value)} className="dashboard-input">
          <option value="">All domains</option>
          {domainOptions.map((domain) => (
            <option key={domain} value={domain}>
              {domain}
            </option>
          ))}
        </select>

        <select value={selectedSkill} onChange={(event) => setSelectedSkill(event.target.value)} className="dashboard-input">
          <option value="">All skills</option>
          {skillOptions.map((skill) => (
            <option key={skill} value={skill}>
              {skill}
            </option>
          ))}
        </select>
      </div>

      {freelancersQuery.isLoading ? <p className="py-10 text-center text-sm text-muted-foreground">Loading freelancers...</p> : null}

      {freelancersQuery.isError ? (
        <p className="py-10 text-center text-sm text-destructive">
          {freelancersQuery.error instanceof Error ? freelancersQuery.error.message : "Unable to load freelancers right now."}
        </p>
      ) : null}

      {!freelancersQuery.isLoading && !freelancersQuery.isError && (freelancersQuery.data?.freelancers.length ?? 0) === 0 ? (
        <p className="py-10 text-center text-sm text-muted-foreground">No freelancers available yet.</p>
      ) : null}

      {!freelancersQuery.isLoading && !freelancersQuery.isError && (freelancersQuery.data?.freelancers.length ?? 0) > 0 ? (
        <>
          {clientDomains.length > 0 || clientSubdomains.length > 0 || clientSkills.length > 0 ? (
            <div className="mb-4 rounded-[12px] border border-border bg-card px-4 py-3 text-xs text-muted-foreground">
              Ranked using your hiring profile: {clientDomains.slice(0, 3).join(", ") || "no domains"} /{" "}
              {clientSubdomains.slice(0, 3).join(", ") || "no subdomains"} / {clientSkills.slice(0, 4).join(", ") || "no skills"}.
            </div>
          ) : null}

          {freelancers.length === 0 ? (
            <p className="py-10 text-center text-sm text-muted-foreground">No freelancers match your current filters.</p>
          ) : (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.18 }} className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {freelancers.map((freelancer) => (
                <FreelancerCard key={freelancer.userId} freelancer={freelancer} />
              ))}
            </motion.div>
          )}
        </>
      ) : null}
    </div>
  );
};

export default FindTalent;
