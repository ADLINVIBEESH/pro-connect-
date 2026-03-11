import { motion } from "framer-motion";
import { Github, Instagram, Linkedin, Twitter } from "lucide-react";

const footerGroups = [
  {
    title: "Categories",
    links: ["Web Development", "Mobile Development", "Video Editing", "UI/UX Design", "Digital Marketing", "Writing & Translation", "AI & Data"],
  },
  {
    title: "For Clients",
    links: ["Post a Job", "Hire Freelancers", "Enterprise Solutions", "Talent Marketplace"],
  },
  {
    title: "For Freelancers",
    links: ["Find Work", "Build Your Profile", "Freelancer Resources", "Community"],
  },
  {
    title: "Company",
    links: ["About Us", "Careers", "Privacy Policy", "Terms of Service"],
  },
] as const;

const footerMotion = {
  initial: { opacity: 0, y: 18 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, amount: 0.2 },
  transition: { duration: 0.28, ease: "easeOut" },
} as const;

const DashboardFooter = () => (
  <motion.footer
    {...footerMotion}
    className="border-t border-border px-1 pb-2 pt-9"
  >
    <div className="grid gap-8 md:grid-cols-2 xl:grid-cols-4">
      {footerGroups.map((group) => (
        <div key={group.title}>
          <p className="text-[1.18rem] font-display font-semibold text-foreground">{group.title}</p>
          <div className="mt-4 space-y-3">
            {group.links.map((link) => (
              <a key={link} href="#" className="block text-[15px] leading-8 text-muted-foreground transition hover:text-foreground">
                {link}
              </a>
            ))}
          </div>
        </div>
      ))}
    </div>
    <div className="mt-10 flex flex-col gap-4 border-t border-border pt-6 sm:flex-row sm:items-center sm:justify-between">
      <p className="font-display text-[1rem] text-muted-foreground">ProConnect freelancer dashboard experience.</p>
      <div className="flex items-center gap-3 text-muted-foreground">
        {[Github, Instagram, Linkedin, Twitter].map((Icon, index) => (
          <a
            key={index}
            href="#"
            className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-border bg-card transition hover:border-accent/60 hover:text-accent"
          >
            <Icon className="h-[18px] w-[18px]" />
          </a>
        ))}
      </div>
    </div>
  </motion.footer>
);

export default DashboardFooter;
