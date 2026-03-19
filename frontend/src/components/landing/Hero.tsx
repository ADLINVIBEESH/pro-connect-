import { motion, useScroll, useTransform, useSpring } from "framer-motion";
import { CheckCircle2, Sparkles } from "lucide-react";
import { useRef } from "react";

// Link and navigation icons removed — buttons removed per user request

const Hero = () => {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const y = useTransform(scrollYProgress, [0, 1], [0, 120]);
  const opacity = useTransform(scrollYProgress, [0, 0.6], [1, 0]);
  const scale = useTransform(scrollYProgress, [0, 1], [1, 1.08]);
  const textY = useTransform(scrollYProgress, [0, 1], [0, 60]);
  const springY = useSpring(textY, { stiffness: 60, damping: 20 });

  return (
    <section ref={ref} className="relative min-h-screen flex items-center overflow-hidden">
      {/* Parallax Background */}
      <motion.div className="absolute inset-0" style={{ y, scale }}>
        <video 
          autoPlay 
          loop 
          muted 
          playsInline 
          preload="metadata"
          aria-hidden="true"
          className="w-full h-full object-cover"
        >
          <source src="/videos/hero.mp4" type="video/mp4" />
        </video>
        <div className="absolute inset-0 bg-black/45" />
      </motion.div>

      {/* Animated Orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          animate={{ x: [0, 40, 0], y: [0, -30, 0], scale: [1, 1.1, 1] }}
          transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-1/5 right-1/4 w-[500px] h-[500px] orb bg-secondary/15"
        />
        <motion.div
          animate={{ x: [0, -30, 0], y: [0, 40, 0], scale: [1, 0.9, 1] }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 2 }}
          className="absolute bottom-1/4 left-1/4 w-[400px] h-[400px] orb bg-accent/10"
        />
        {[...Array(6)].map((_, i) => (
          <motion.div
            key={i}
            animate={{ y: [-20, -80, -20], opacity: [0.4, 0.9, 0.4], x: [0, i % 2 === 0 ? 20 : -20, 0] }}
            transition={{ duration: 4 + i, repeat: Infinity, ease: "easeInOut", delay: i * 0.8 }}
            className="absolute w-2 h-2 rounded-full glass"
            style={{ left: `${10 + i * 15}%`, top: `${30 + (i % 3) * 20}%` }}
          />
        ))}
      </div>

      {/* Grid overlay */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.03]"
        style={{
          backgroundImage: "linear-gradient(hsl(0 0% 100%) 1px, transparent 1px), linear-gradient(90deg, hsl(0 0% 100%) 1px, transparent 1px)",
          backgroundSize: "80px 80px",
        }}
      />

      <motion.div style={{ y: springY, opacity }} className="relative container mx-auto px-6 pt-32 pb-24">
        <div className="max-w-4xl">
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.1, ease: "easeOut" }}
          >
            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass text-secondary text-sm font-medium mb-8 border border-secondary/30">
              <Sparkles className="w-3.5 h-3.5 text-secondary animate-pulse-glow" />
              Trusted by 10,000+ professionals worldwide
            </span>
          </motion.div>

          {/* Headline */}
          <motion.h1
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
            className="text-5xl md:text-7xl lg:text-8xl font-display font-bold text-primary-foreground leading-[1.05] tracking-tight mb-6"
          >
            Hire the World's
            <br />
            <span className="text-gradient">
              Best Freelancers
            </span>
            <br />
            <span className="text-primary-foreground/85">On Demand</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.35, ease: "easeOut" }}
            className="text-lg md:text-xl text-primary-foreground/60 mb-10 max-w-xl leading-relaxed"
          >
            Post a job and get proposals from verified freelancers in minutes.
            From code to design — find experts for any project, any budget.
          </motion.p>

          {/* Trust signals */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.7, delay: 0.65 }}
            className="flex flex-wrap gap-5 mb-14"
          >
            {["No commission fees", "1,800+ skill categories", "Secure milestone payments", "24/7 support"].map((f, i) => (
              <motion.span
                key={f}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.7 + i * 0.1 }}
                className="flex items-center gap-1.5 text-sm text-primary-foreground/65"
              >
                <CheckCircle2 className="w-4 h-4 text-secondary flex-shrink-0" />
                {f}
              </motion.span>
            ))}
          </motion.div>

          {/* Stats — glass cards */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.8 }}
            className="flex gap-4 flex-wrap"
          >
            {[
              { value: "50K+", label: "Freelancers", color: "text-secondary" },
              { value: "12K+", label: "Companies", color: "text-accent" },
              { value: "98%", label: "Satisfaction", color: "text-primary-foreground" },
            ].map((stat) => (
              <motion.div
                key={stat.label}
                whileHover={{ scale: 1.05, y: -2 }}
                transition={{ duration: 0.2 }}
                className="liquid-surface px-6 py-4 rounded-2xl"
              >
                <div className={`text-2xl font-display font-bold ${stat.color}`}>{stat.value}</div>
                <div className="text-xs text-primary-foreground/50 mt-0.5">{stat.label}</div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </motion.div>

      {/* Scroll indicator */}
      <motion.div
        style={{ opacity }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2"
      >
        <span className="text-xs text-primary-foreground/30 font-medium tracking-widest uppercase">Scroll</span>
        <motion.div
          animate={{ y: [0, 8, 0] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
          className="w-5 h-8 rounded-full glass flex items-start justify-center pt-1.5"
        >
          <div className="w-1 h-2 rounded-full bg-primary-foreground/40" />
        </motion.div>
      </motion.div>
    </section>
  );
};

export default Hero;
