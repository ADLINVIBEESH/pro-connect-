import { motion, useScroll, useTransform, useSpring, useInView } from "framer-motion";
import { useRef, useEffect, useState } from "react";

const stats = [
  { value: 50000, suffix: "+", label: "Active Freelancers", description: "professionals ready to work" },
  { value: 12000, suffix: "+", label: "Partner Companies", description: "businesses hiring globally" },
  { value: 98, suffix: "%", label: "Satisfaction Rate", description: "from verified reviews" },
  { value: 2500000, suffix: "+", label: "Dollars Paid Out", description: "to freelancers worldwide" },
];

const formatNum = (n: number) => {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + "M";
  if (n >= 1_000) return (n / 1_000).toFixed(0) + "K";
  return n.toString();
};

const CountUp = ({ target, suffix }: { target: number; suffix: string }) => {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true });

  useEffect(() => {
    if (!inView) return;
    let start = 0;
    const end = target;
    const duration = 2000;
    const step = (end / duration) * 16;
    const timer = setInterval(() => {
      start += step;
      if (start >= end) {
        setCount(end);
        clearInterval(timer);
      } else {
        setCount(Math.floor(start));
      }
    }, 16);
    return () => clearInterval(timer);
  }, [inView, target]);

  return (
    <span ref={ref}>
      {formatNum(count)}{suffix}
    </span>
  );
};

const StatsSection = () => {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const y = useTransform(scrollYProgress, [0, 1], [40, -40]);

  return (
    <section ref={ref} className="py-24 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-r from-secondary/8 via-background to-accent/6 pointer-events-none" />
      
      <motion.div style={{ y }} className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/3 w-80 h-80 orb bg-secondary/6" />
        <div className="absolute bottom-0 right-1/3 w-64 h-64 orb bg-accent/5" />
      </motion.div>

      <div className="relative container mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-14"
        >
          <h2 className="text-3xl md:text-4xl font-display font-bold text-foreground tracking-tight">
            Trusted at scale
          </h2>
          <p className="text-muted-foreground mt-3 text-sm">Numbers that speak for themselves.</p>
        </motion.div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 max-w-5xl mx-auto">
          {stats.map((s, i) => (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, y: 32, scale: 0.95 }}
              whileInView={{ opacity: 1, y: 0, scale: 1 }}
              viewport={{ once: true, margin: "-30px" }}
              transition={{ delay: i * 0.1, duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
              whileHover={{ y: -4, scale: 1.02 }}
              className="group p-7 rounded-3xl bg-card/80 card-shadow hover:card-shadow-hover border border-border hover:border-secondary/20 transition-all duration-300 text-center backdrop-blur-sm"
            >
              <div className="text-3xl md:text-4xl font-display font-black text-gradient mb-2">
                <CountUp target={s.value} suffix={s.suffix} />
              </div>
              <div className="font-semibold text-foreground text-sm mb-1">{s.label}</div>
              <div className="text-xs text-muted-foreground">{s.description}</div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default StatsSection;
