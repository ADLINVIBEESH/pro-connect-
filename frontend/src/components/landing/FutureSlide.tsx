import { motion, useScroll, useTransform, useMotionValue, useSpring } from "framer-motion";
import { Cpu, Layers, Zap, Globe2, ArrowUpRight } from "lucide-react";
import { useRef, useState } from "react";
import futureImg from "@/assets/freelancer-future.jpg";

const floatingCards = [
  { icon: <Cpu className="w-4 h-4" />, label: "AI Skill Matching", value: "99.2% accuracy", color: "text-secondary", bg: "bg-secondary/15", delay: 0 },
  { icon: <Layers className="w-4 h-4" />, label: "Projects Live", value: "3,840 right now", color: "text-accent", bg: "bg-accent/15", delay: 0.4 },
  { icon: <Globe2 className="w-4 h-4" />, label: "Countries Active", value: "120+ nations", color: "text-secondary", bg: "bg-secondary/15", delay: 0.8 },
  { icon: <Zap className="w-4 h-4" />, label: "Avg. Match Time", value: "Under 4 hours", color: "text-accent", bg: "bg-accent/15", delay: 1.2 },
];

// Tilt card hook
const useTilt = () => {
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const rotateX = useSpring(useTransform(y, [-0.5, 0.5], [12, -12]), { stiffness: 200, damping: 20 });
  const rotateY = useSpring(useTransform(x, [-0.5, 0.5], [-12, 12]), { stiffness: 200, damping: 20 });

  const onMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    x.set((e.clientX - rect.left) / rect.width - 0.5);
    y.set((e.clientY - rect.top) / rect.height - 0.5);
  };
  const onMouseLeave = () => { x.set(0); y.set(0); };

  return { rotateX, rotateY, onMouseMove, onMouseLeave };
};

const FutureSlide = () => {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });

  // Staggered 3-D slide-in from bottom
  const ySection = useTransform(scrollYProgress, [0, 0.25], [80, 0]);
  const opacitySection = useTransform(scrollYProgress, [0, 0.25], [0, 1]);

  // Parallax depth layers
  const imgY = useTransform(scrollYProgress, [0, 1], [-30, 30]);

  const tilt = useTilt();

  return (
    <section ref={ref} className="py-36 relative overflow-hidden">
      {/* Deep space gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-[hsl(230_60%_6%)] via-[hsl(222_55%_10%)] to-[hsl(210_50%_8%)]" />

      {/* Animated grid */}
      <motion.div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: "linear-gradient(hsl(160 84% 39% / 0.07) 1px, transparent 1px), linear-gradient(90deg, hsl(160 84% 39% / 0.07) 1px, transparent 1px)",
          backgroundSize: "60px 60px",
        }}
        animate={{ backgroundPosition: ["0px 0px", "60px 60px"] }}
        transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
      />

      {/* Glowing orbs */}
      <motion.div
        animate={{ scale: [1, 1.15, 1], opacity: [0.4, 0.7, 0.4] }}
        transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
        className="absolute top-1/4 left-1/3 w-[500px] h-[500px] rounded-full pointer-events-none"
        style={{ background: "radial-gradient(circle, hsl(160 84% 39% / 0.15) 0%, transparent 70%)" }}
      />
      <motion.div
        animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.6, 0.3] }}
        transition={{ duration: 7, repeat: Infinity, ease: "easeInOut", delay: 2 }}
        className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] rounded-full pointer-events-none"
        style={{ background: "radial-gradient(circle, hsl(25 95% 53% / 0.12) 0%, transparent 70%)" }}
      />

      {/* Scanning line animation */}
      <motion.div
        className="absolute left-0 right-0 h-px pointer-events-none"
        style={{ background: "linear-gradient(90deg, transparent, hsl(160 84% 39% / 0.6), transparent)" }}
        animate={{ top: ["10%", "90%", "10%"] }}
        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
      />

      <div className="relative container mx-auto px-6">
        <motion.div style={{ y: ySection, opacity: opacitySection }}>

          {/* Section header */}
          <div className="text-center mb-20">
            <motion.span
              initial={{ opacity: 0, scale: 0.8 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="inline-flex items-center gap-2 text-xs font-bold text-secondary uppercase tracking-widest mb-5 px-4 py-1.5 rounded-full border border-secondary/30 bg-secondary/10"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-secondary animate-pulse" />
              The Future of Freelancing
            </motion.span>

            <motion.h2
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7, delay: 0.1 }}
              className="text-4xl md:text-6xl font-display font-bold text-primary-foreground mt-3 mb-6 tracking-tight leading-[1.08]"
            >
              Where talent meets
              <br />
              <span className="text-gradient">intelligent technology</span>
            </motion.h2>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-primary-foreground/55 text-lg leading-relaxed max-w-2xl mx-auto"
            >
              ProConnect doesn't just list jobs — it understands them. Our intelligent matching engine reads your skills, work style, and past performance to surface only the opportunities that are genuinely right for you, cutting the noise and saving you hours every week.
            </motion.p>
          </div>

          {/* Main content: 3D tilt image + floating cards */}
          <div className="grid lg:grid-cols-2 gap-16 items-center">

            {/* Left: 3D tilt image */}
            <motion.div
              style={{ perspective: 1200 }}
              {...tilt}
              className="cursor-pointer"
            >
              <motion.div
                style={{ rotateX: tilt.rotateX, rotateY: tilt.rotateY, y: imgY }}
                className="relative rounded-3xl overflow-hidden shadow-[0_40px_80px_hsl(0_0%_0%/0.5)] ring-1 ring-secondary/20"
              >
                <img
                  src={futureImg}
                  alt="Futuristic freelancing platform"
                  className="w-full h-[460px] object-cover"
                />
                {/* Holographic overlay */}
                <div className="absolute inset-0 bg-gradient-to-tr from-secondary/10 via-transparent to-accent/10 mix-blend-screen" />
                {/* Scan lines */}
                <div
                  className="absolute inset-0 pointer-events-none opacity-20"
                  style={{ backgroundImage: "repeating-linear-gradient(0deg, transparent, transparent 3px, hsl(0 0% 0% / 0.3) 3px, hsl(0 0% 0% / 0.3) 4px)" }}
                />
                {/* Corner brackets */}
                {[
                  "top-3 left-3 border-t-2 border-l-2 rounded-tl-xl",
                  "top-3 right-3 border-t-2 border-r-2 rounded-tr-xl",
                  "bottom-3 left-3 border-b-2 border-l-2 rounded-bl-xl",
                  "bottom-3 right-3 border-b-2 border-r-2 rounded-br-xl",
                ].map((cls, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, scale: 1.3 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.4 + i * 0.1 }}
                    className={`absolute w-6 h-6 border-secondary/70 ${cls}`}
                  />
                ))}
              </motion.div>
            </motion.div>

            {/* Right: staggered floating info cards */}
            <div className="space-y-4">
              <motion.p
                initial={{ opacity: 0, x: 40 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6 }}
                className="text-primary-foreground/60 text-base leading-[1.8] mb-8"
              >
                Every day, thousands of businesses post projects and thousands of skilled professionals apply. The challenge isn't finding talent — it's finding the <em className="text-secondary not-italic font-semibold">right</em> talent for your exact need. ProConnect's AI layer solves this by continuously learning from successful matches, rejected proposals, and project outcomes to deliver recommendations that get sharper over time.
              </motion.p>

              {floatingCards.map((card, i) => (
                <motion.div
                  key={card.label}
                  initial={{ opacity: 0, x: 60 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: card.delay, duration: 0.55, ease: "easeOut" }}
                  whileHover={{ scale: 1.02, x: 5 }}
                  className="group flex items-center gap-4 p-4 rounded-2xl border border-white/8 bg-white/5 hover:bg-white/10 hover:border-secondary/30 transition-all duration-300 cursor-default"
                >
                  <motion.div
                    animate={{ rotate: [0, 5, -5, 0] }}
                    transition={{ duration: 3 + i, repeat: Infinity, ease: "easeInOut", delay: i * 0.5 }}
                    className={`w-11 h-11 rounded-xl ${card.bg} ${card.color} flex items-center justify-center flex-shrink-0`}
                  >
                    {card.icon}
                  </motion.div>
                  <div className="flex-1">
                    <p className="text-[11px] text-primary-foreground/40 uppercase tracking-wider">{card.label}</p>
                    <p className={`text-base font-display font-bold ${card.color}`}>{card.value}</p>
                  </div>
                  <ArrowUpRight className="w-4 h-4 text-primary-foreground/20 group-hover:text-secondary group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all duration-200" />
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default FutureSlide;
