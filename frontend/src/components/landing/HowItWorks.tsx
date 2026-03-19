import { motion, useScroll, useTransform } from "framer-motion";
import { UserPlus, Search, Handshake, ArrowRight } from "lucide-react";
import { useRef } from "react";

const steps = [
  {
    icon: <UserPlus className="w-7 h-7" />,
    title: "Create Account",
    description: "Sign up in seconds and tell us if you're here to hire or find work.",
    accent: "secondary",
    colorClass: "bg-secondary/15 text-secondary border-secondary/25",
    glowClass: "group-hover:shadow-[0_0_40px_hsl(160_84%_39%/0.3)]",
    num: "01",
  },
  {
    icon: <Search className="w-7 h-7" />,
    title: "Post or Browse",
    description: "Hirers post projects, freelancers browse opportunities that match their skills.",
    accent: "accent",
    colorClass: "bg-accent/15 text-accent border-accent/25",
    glowClass: "group-hover:shadow-[0_0_40px_hsl(25_95%_53%/0.3)]",
    num: "02",
  },
  {
    icon: <Handshake className="w-7 h-7" />,
    title: "Connect & Build",
    description: "Match with the perfect partner and start collaborating immediately.",
    accent: "primary",
    colorClass: "bg-primary/15 text-primary-foreground border-primary/25",
    glowClass: "group-hover:shadow-[0_0_40px_hsl(222_60%_18%/0.3)]",
    num: "03",
  },
];

const HowItWorks = () => {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const lineProgress = useTransform(scrollYProgress, [0.1, 0.6], [0, 1]);

  return (
    <section ref={ref} id="how-it-works" className="py-32 relative overflow-hidden">
      {/* Dark gradient background for contrast */}
      <div className="absolute inset-0 bg-gradient-to-b from-muted/30 via-primary/5 to-muted/30 pointer-events-none" />

      <div className="relative container mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="text-center mb-20"
        >
          <span className="inline-block text-xs font-bold text-accent uppercase tracking-widest mb-4 px-4 py-1.5 rounded-full bg-accent/10 border border-accent/20">
            Simple Process
          </span>
          <h2 className="text-4xl md:text-5xl font-display font-bold text-foreground mt-2 tracking-tight">
            How It Works
          </h2>
          <p className="text-muted-foreground mt-4 max-w-md mx-auto">
            Three simple steps to start hiring or earning today.
          </p>
        </motion.div>

        <div className="relative max-w-5xl mx-auto">
          {/* Animated connector line */}
          <div className="hidden md:block absolute top-12 left-[16.67%] right-[16.67%] h-px overflow-hidden">
            <div className="w-full h-full bg-border" />
            <motion.div
              className="absolute top-0 left-0 h-full bg-gradient-to-r from-secondary via-accent to-primary rounded-full"
              style={{ scaleX: lineProgress, transformOrigin: "left" }}
            />
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {steps.map((step, i) => (
              <motion.div
                key={step.title}
                initial={{ opacity: 0, y: 40, scale: 0.95 }}
                whileInView={{ opacity: 1, y: 0, scale: 1 }}
                viewport={{ once: true, margin: "-40px" }}
                transition={{ delay: i * 0.18, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                whileHover={{ y: -6 }}
                className="group relative text-center"
              >
                <div className={`relative inline-block mb-6 rounded-3xl p-5 border transition-all duration-400 ${step.colorClass} ${step.glowClass}`}>
                  {step.icon}
                  <span className="absolute -top-3 -right-3 w-7 h-7 rounded-full bg-card border-2 border-border text-xs font-bold text-muted-foreground flex items-center justify-center font-display">
                    {i + 1}
                  </span>
                </div>

                <div className="absolute top-4 right-4 text-5xl font-display font-black text-muted/30 select-none">
                  {step.num}
                </div>

                <h3 className="text-xl font-display font-semibold text-foreground mb-3">{step.title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">{step.description}</p>

                {i < steps.length - 1 && (
                  <ArrowRight className="hidden md:block absolute top-10 -right-5 w-5 h-5 text-muted-foreground/30 z-10" />
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
