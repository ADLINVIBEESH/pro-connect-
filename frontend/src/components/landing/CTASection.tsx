import { motion, useScroll, useTransform } from "framer-motion";
import { ArrowRight, Briefcase, Users } from "lucide-react";
import { useRef } from "react";
import { Link } from "react-router-dom";

const CTASection = () => {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const scale = useTransform(scrollYProgress, [0, 0.5], [0.92, 1]);
  const opacity = useTransform(scrollYProgress, [0, 0.25], [0, 1]);

  return (
    <section ref={ref} className="py-24 px-6 relative overflow-hidden">
      <div className="container mx-auto max-w-4xl">
        <motion.div
          style={{ scale, opacity }}
          className="relative rounded-3xl overflow-hidden p-12 md:p-20 text-center"
        >
          {/* Liquid glass dark background */}
          <div className="absolute inset-0 hero-gradient" />
          <div className="absolute inset-0 pointer-events-none">
            <motion.div
              animate={{ x: [0, 30, 0], y: [0, -20, 0] }}
              transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
              className="absolute top-0 right-1/4 w-72 h-72 orb bg-secondary/20"
            />
            <motion.div
              animate={{ x: [0, -20, 0], y: [0, 20, 0] }}
              transition={{ duration: 8, repeat: Infinity, ease: "easeInOut", delay: 2 }}
              className="absolute bottom-0 left-1/4 w-60 h-60 orb bg-accent/15"
            />
          </div>
          {/* Glass inner overlay */}
          <div className="absolute inset-0 glass-strong rounded-3xl" style={{ background: "hsl(0 0% 100% / 0.04)" }} />
          {/* Top highlight */}
          <div className="absolute top-0 left-8 right-8 h-px bg-gradient-to-r from-transparent via-primary-foreground/20 to-transparent" />

          <div className="relative">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <span className="inline-block text-xs font-bold text-secondary uppercase tracking-widest mb-5 px-4 py-1.5 rounded-full glass border border-secondary/30">
                Join Today
              </span>
              <h2 className="text-4xl md:text-6xl font-display font-bold text-primary-foreground mb-5 tracking-tight leading-tight">
                Ready to get
                <br />
                <span className="text-gradient">started?</span>
              </h2>
              <p className="text-primary-foreground/55 text-base md:text-lg mb-10 max-w-md mx-auto leading-relaxed">
                Join 50,000+ professionals already using ProConnect to build incredible things.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link
                  to="/signup"
                  className="group inline-flex items-center justify-center gap-2.5 px-8 py-4 rounded-2xl bg-secondary text-secondary-foreground font-semibold text-base hover:opacity-95 transition-all duration-300 shadow-lg shadow-secondary/40 hover:shadow-xl hover:shadow-secondary/50 hover:-translate-y-1"
                >
                  <Briefcase className="w-5 h-5" />
                  Hire Talent
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Link>
                <Link
                  to="/signup"
                  className="group inline-flex items-center justify-center gap-2.5 px-8 py-4 rounded-2xl glass text-primary-foreground font-semibold text-base hover:bg-white/15 transition-all duration-300 border border-white/20 hover:-translate-y-1"
                >
                  <Users className="w-5 h-5" />
                  Find Work
                </Link>
              </div>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default CTASection;
