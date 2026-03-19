import { motion, useScroll, useTransform } from "framer-motion";
import { MessageCircle, CheckSquare, FolderOpen, Clock } from "lucide-react";
import { useRef } from "react";
import collaborateImg from "@/assets/freelancer-collaborate.jpg";

const tools = [
  {
    icon: <MessageCircle className="w-5 h-5" />,
    title: "Instant Messaging",
    desc: "Chat with clients or freelancers in real time. Share files, leave feedback, and keep every conversation organised in one thread.",
    color: "text-secondary",
    bg: "bg-secondary/10",
    border: "border-secondary/20",
  },
  {
    icon: <CheckSquare className="w-5 h-5" />,
    title: "Milestone Contracts",
    desc: "Break any project into clear, paid milestones. Work gets approved before funds are released — protecting both sides every step of the way.",
    color: "text-accent",
    bg: "bg-accent/10",
    border: "border-accent/20",
  },
  {
    icon: <FolderOpen className="w-5 h-5" />,
    title: "Shared Workspace",
    desc: "Upload briefs, design files, and deliverables to a shared project folder. No email chains, no lost attachments — everything in one place.",
    color: "text-secondary",
    bg: "bg-secondary/10",
    border: "border-secondary/20",
  },
  {
    icon: <Clock className="w-5 h-5" />,
    title: "Time Tracking",
    desc: "Log billable hours automatically with our built-in tracker. Clients see transparent timesheets and invoices are generated instantly.",
    color: "text-accent",
    bg: "bg-accent/10",
    border: "border-accent/20",
  },
];

const CollaborateSlide = () => {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "center center"] });
  const imgX = useTransform(scrollYProgress, [0, 1], [100, 0]);
  const textX = useTransform(scrollYProgress, [0, 1], [-100, 0]);
  const opacity = useTransform(scrollYProgress, [0, 0.4], [0, 1]);

  return (
    <section ref={ref} className="py-36 relative overflow-hidden bg-background">
      {/* Subtle background */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-0 w-[600px] h-[600px] orb bg-secondary/5" />
        <div className="absolute bottom-0 right-0 w-[400px] h-[400px] orb bg-accent/4" />
      </div>

      <div className="container mx-auto px-6">
        <div className="grid lg:grid-cols-2 gap-20 items-center">

          {/* ── Left: copy ── */}
          <motion.div style={{ x: textX, opacity }}>
            <span className="inline-block text-xs font-bold text-secondary uppercase tracking-widest mb-5 px-4 py-1.5 rounded-full bg-secondary/10 border border-secondary/20">
              Built-in Collaboration
            </span>

            <h2 className="text-4xl md:text-5xl font-display font-bold text-foreground mt-3 mb-5 tracking-tight leading-[1.12]">
              Every tool you need,
              <br />
              <span className="text-gradient">right inside the platform</span>
            </h2>

            <p className="text-muted-foreground text-[1.05rem] leading-[1.8] mb-4">
              Forget juggling Slack, Google Drive, and spreadsheets. ProConnect gives you a complete collaboration suite built specifically for client–freelancer work, so you spend less time managing and more time creating.
            </p>
            <p className="text-muted-foreground text-[1.05rem] leading-[1.8] mb-10">
              From the moment a contract is signed to the final delivery, every interaction is tracked, timestamped, and stored securely — giving both parties full confidence throughout the project.
            </p>

            {/* Feature grid */}
            <div className="grid sm:grid-cols-2 gap-4 mb-10">
              {tools.map((t, i) => (
                <motion.div
                  key={t.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1, duration: 0.45, ease: "easeOut" }}
                  className={`p-4 rounded-2xl border bg-card/70 ${t.border} hover:shadow-sm transition-all duration-300 backdrop-blur-sm`}
                >
                  <div className={`w-9 h-9 rounded-xl ${t.bg} ${t.color} flex items-center justify-center mb-3`}>
                    {t.icon}
                  </div>
                  <h4 className="font-display font-semibold text-foreground text-sm mb-1.5">{t.title}</h4>
                  <p className="text-xs text-muted-foreground leading-relaxed">{t.desc}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* ── Right: image ── */}
          <motion.div style={{ x: imgX, opacity }} className="relative">
            <div className="relative rounded-3xl overflow-hidden shadow-2xl ring-1 ring-border">
              <img
                src={collaborateImg}
                alt="Designer working on UX wireframes"
                className="w-full h-[500px] object-cover object-center"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-primary/30 via-transparent to-transparent" />
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default CollaborateSlide;
