import { motion, useScroll, useTransform } from "framer-motion";
import { DollarSign, TrendingUp, Clock, Star, BadgeCheck } from "lucide-react";
import { useRef } from "react";
import successImg from "@/assets/freelancer-success.jpg";

const benefits = [
  {
    icon: <DollarSign className="w-5 h-5" />,
    title: "Set Your Own Rates",
    desc: "No platform-imposed caps. You price your expertise fairly, and clients come to you knowing exactly what to expect. Transparent, honest, and always in your control.",
    color: "text-secondary",
    bg: "bg-secondary/10",
    border: "border-secondary/20",
  },
  {
    icon: <TrendingUp className="w-5 h-5" />,
    title: "Scale Without Limits",
    desc: "Start with a single client and grow to a full roster. Our ranking system rewards quality work with more visibility — the better you perform, the more you earn.",
    color: "text-accent",
    bg: "bg-accent/10",
    border: "border-accent/20",
  },
  {
    icon: <BadgeCheck className="w-5 h-5" />,
    title: "Get Verified & Stand Out",
    desc: "A ProConnect Verified badge tells clients you've passed skill assessments and identity checks — dramatically increasing your chances of landing premium contracts.",
    color: "text-secondary",
    bg: "bg-secondary/10",
    border: "border-secondary/20",
  },
  {
    icon: <Clock className="w-5 h-5" />,
    title: "Work on Your Own Terms",
    desc: "Full-time freelancer or weekend side hustle — you set availability, preferred project types, and contract length. Build the career that fits your life, not the other way around.",
    color: "text-accent",
    bg: "bg-accent/10",
    border: "border-accent/20",
  },
];

const EarningsSlide = () => {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "center center"] });
  const imgX = useTransform(scrollYProgress, [0, 1], [-100, 0]);
  const textX = useTransform(scrollYProgress, [0, 1], [100, 0]);
  const opacity = useTransform(scrollYProgress, [0, 0.4], [0, 1]);

  return (
    <section ref={ref} className="py-36 relative overflow-hidden">
      {/* Rich dark background */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary/95 to-primary/90" />
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 right-0 w-[700px] h-[700px] orb bg-secondary/10" />
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] orb bg-accent/8" />
      </div>
      {/* Subtle grid */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.035]"
        style={{
          backgroundImage: "linear-gradient(hsl(0 0% 100%) 1px, transparent 1px), linear-gradient(90deg, hsl(0 0% 100%) 1px, transparent 1px)",
          backgroundSize: "64px 64px",
        }}
      />

      <div className="relative container mx-auto px-6">
        <div className="grid lg:grid-cols-2 gap-20 items-center">

          {/* ── Left: image ── */}
          <motion.div style={{ x: imgX, opacity }} className="relative">
            <div className="relative rounded-3xl overflow-hidden shadow-2xl ring-1 ring-white/10">
              <img
                src={successImg}
                alt="Freelancer reviewing earnings dashboard"
                className="w-full h-[520px] object-cover object-top"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-primary/50 via-transparent to-transparent" />
            </div>
          </motion.div>

          {/* ── Right: copy ── */}
          <motion.div style={{ x: textX, opacity }}>
            <span className="inline-block text-xs font-bold text-accent uppercase tracking-widest mb-5 px-4 py-1.5 rounded-full glass border border-accent/30">
              For Freelancers
            </span>

            <h2 className="text-4xl md:text-5xl font-display font-bold text-primary-foreground mt-3 mb-5 tracking-tight leading-[1.12]">
              Turn your expertise
              <br />
              <span className="text-gradient">into a thriving career</span>
            </h2>

            <p className="text-primary-foreground/65 text-[1.05rem] leading-[1.8] mb-4">
              Thousands of freelancers have left traditional employment to build careers they love — setting their own hours, choosing their clients, and earning more than they ever thought possible.
            </p>
            <p className="text-primary-foreground/65 text-[1.05rem] leading-[1.8] mb-10">
              ProConnect gives you the infrastructure to do the same: a polished portfolio page, smart job matching, secure contracts, and a growing community of clients who are actively looking for exactly your skills.
            </p>

            {/* Benefits */}
            <div className="space-y-4 mb-10">
              {benefits.map((b, i) => (
                <motion.div
                  key={b.title}
                  initial={{ opacity: 0, x: 30 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1, duration: 0.45, ease: "easeOut" }}
                  whileHover={{ x: 4 }}
                  className={`flex items-start gap-4 p-4 rounded-2xl border ${b.border} bg-white/5 hover:bg-white/8 transition-all duration-300`}
                >
                  <div className={`w-10 h-10 rounded-xl ${b.bg} ${b.color} flex items-center justify-center flex-shrink-0 mt-0.5`}>
                    {b.icon}
                  </div>
                  <div>
                    <h4 className="font-display font-semibold text-primary-foreground text-sm mb-1">{b.title}</h4>
                    <p className="text-xs text-primary-foreground/50 leading-relaxed">{b.desc}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default EarningsSlide;
