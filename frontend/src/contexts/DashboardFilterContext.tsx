import React, { createContext, useContext, useState, ReactNode } from "react";

interface DashboardFilterState {
  category: string | null;
  skills: string[];
}

interface DashboardFilterContextType {
  category: string | null;
  setCategory: (category: string | null) => void;
  skills: string[];
  setSkills: (skills: string[]) => void;
  toggleSkill: (skill: string) => void;
  clearFilters: () => void;
}

const DashboardFilterContext = createContext<DashboardFilterContextType | undefined>(undefined);

export const DashboardFilterProvider = ({ children }: { children: ReactNode }) => {
  const [category, setCategory] = useState<string | null>(null);
  const [skills, setSkills] = useState<string[]>([]);

  const toggleSkill = (skill: string) => {
    setSkills((prev) =>
      prev.includes(skill) ? prev.filter((s) => s !== skill) : [...prev, skill]
    );
  };

  const clearFilters = () => {
    setCategory(null);
    setSkills([]);
  };

  return (
    <DashboardFilterContext.Provider
      value={{ category, setCategory, skills, setSkills, toggleSkill, clearFilters }}
    >
      {children}
    </DashboardFilterContext.Provider>
  );
};

export const useDashboardFilter = () => {
  const ctx = useContext(DashboardFilterContext);
  if (!ctx) return null;
  return ctx;
};
