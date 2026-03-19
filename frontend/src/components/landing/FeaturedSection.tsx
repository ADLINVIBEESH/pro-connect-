import { motion, useScroll, useTransform } from "framer-motion";
import { TrendingUp, Shield, Zap, Globe, Star, ArrowRight } from "lucide-react";
import { useRef } from "react";
import { Link } from "react-router-dom";

const features = [
  {
    icon: <Zap className="w-6 h-6" />,
    title: "Lightning Fast Matching",
    description: "Our AI-powered system matches you with the perfect talent or project in seconds.",
    color: "text-accent",
    bg: "bg-accent/10",
    border: "border-accent/20",
  },
  {
    icon: <Shield className="w-6 h-6" />,
    title: "Verified Professionals",
    description: "Every profile goes through rigorous verification for skill and identity.",
    color: "text-secondary",
    bg: "bg-secondary/10",
    border: "border-secondary/20",
  },
  {
    icon: <TrendingUp className="w-6 h-6" />,
    title: "Growth Analytics",
    description: "Track your performance, earnings, and career progression with real-time insights.",
    color: "text-primary-foreground",
    bg: "bg-primary/10",
    border: "border-primary/20",
  },
  {
    icon: <Globe className="w-6 h-6" />,
    title: "Global Network",
    description: "Connect with professionals from 120+ countries and expand your reach worldwide.",
    color: "text-accent",
    bg: "bg-accent/10",
    border: "border-accent/20",
  },
];

const FeaturedSection = () => {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "center center"] });
  const x1 = useTransform(scrollYProgress, [0, 1], [-60, 0]);
  const x2 = useTransform(scrollYProgress, [0, 1], [60, 0]);
  const opacity = useTransform(scrollYProgress, [0, 0.3], [0, 1]);

  return (
    <section ref={ref} className="py-32 relative overflow-hidden">
      {/* Liquid glass dark section */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/97 via-primary to-primary/90" />
      <div className="absolute top-0 right-0 w-[600px] h-[600px] orb bg-secondary/12 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] orb bg-accent/8 pointer-events-none" />

      {/* Grid pattern */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.04]"
        style={{
          backgroundImage: "linear-gradient(hsl(0 0% 100%) 1px, transparent 1px), linear-gradient(90deg, hsl(0 0% 100%) 1px, transparent 1px)",
          backgroundSize: "60px 60px",
        }}
      />

      <div className="relative container mx-auto px-6">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          {/* Left: Content */}
          <motion.div style={{ x: x1, opacity }}>
            <span className="inline-block text-xs font-bold text-secondary uppercase tracking-widest mb-4 px-4 py-1.5 rounded-full glass border border-secondary/30 text-secondary">
              Why ProConnect
            </span>
            <h2 className="text-4xl md:text-5xl font-display font-bold text-primary-foreground mt-3 mb-6 leading-tight tracking-tight">
              Everything you need
              <br />
              <span className="text-gradient">in one platform</span>
            </h2>
            <p className="text-primary-foreground/55 text-base leading-relaxed mb-8 max-w-md">
              ProConnect brings together the best tools for hiring and freelancing — from smart matching to secure payments, all under one roof.
            </p>
            <Link
              to="/signup"
              className="group inline-flex items-center gap-2 px-6 py-3.5 rounded-xl bg-secondary text-secondary-foreground font-semibold text-sm hover:opacity-95 transition-all duration-300 shadow-lg shadow-secondary/30 hover:shadow-xl hover:shadow-secondary/40 hover:-translate-y-0.5"
            >
              Start for free
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </motion.div>

          {/* Right: Feature cards */}
          <motion.div style={{ x: x2, opacity }} className="grid grid-cols-2 gap-4">
            {features.map((f, i) => (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                whileHover={{ scale: 1.04, y: -4 }}
                className={`p-5 rounded-2xl glass-card border ${f.border} transition-all duration-300`}
              >
                <div className={`w-11 h-11 rounded-xl ${f.bg} ${f.color} flex items-center justify-center mb-4`}>
                  {f.icon}
                </div>
                <h3 className="font-display font-semibold text-primary-foreground text-sm mb-2">{f.title}</h3>
                <p className="text-xs text-primary-foreground/45 leading-relaxed">{f.description}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default FeaturedSection;
