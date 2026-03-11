import { motion } from "framer-motion";
import { Users, Briefcase, CheckCircle2 } from "lucide-react";

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 32 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.65, delay, ease: "easeOut" as const },
});

const Hero = () => {
  return (
    <section className="relative flex min-h-screen items-center overflow-hidden">
      <div className="absolute inset-0">
        <video
          className="h-full w-full object-cover"
          autoPlay
          loop
          muted
          playsInline
          preload="metadata"
          aria-hidden="true"
        >
          <source src="/videos/hero.mp4" type="video/mp4" />
        </video>
        <div className="absolute inset-0 bg-black/45" />
        <div className="absolute right-1/4 top-1/4 h-96 w-96 animate-float rounded-full bg-secondary/10 blur-3xl" />
        <div
          className="absolute bottom-1/4 left-1/3 h-72 w-72 animate-float rounded-full bg-accent/8 blur-3xl"
          style={{ animationDelay: "1.5s" }}
        />
      </div>

      <div className="relative container mx-auto px-6 pb-20 pt-28">
        <div className="max-w-3xl">
          <motion.div {...fadeUp(0)}>
            <span className="mb-8 inline-flex items-center gap-2 rounded-full glass px-4 py-2 text-[15px] font-medium text-secondary">
              <span className="h-2 w-2 rounded-full bg-secondary animate-pulse-glow" />
              Trusted by 10,000+ professionals worldwide
            </span>
          </motion.div>

          <motion.h1
            {...fadeUp(0.1)}
            className="mb-6 text-5xl font-display font-bold leading-[1.08] tracking-[0.015em] text-white md:text-7xl"
          >
            Connect with
            <br />
            <span className="text-gradient">Top Talent</span>
            <br />
            Instantly
          </motion.h1>

          <motion.p
            {...fadeUp(0.2)}
            className="mb-10 max-w-xl text-[19px] leading-relaxed tracking-[0.012em] text-white md:text-[22px]"
          >
            The professional marketplace connecting businesses with world-class freelancers. Find the perfect match for
            any project.
          </motion.p>

          <motion.div {...fadeUp(0.3)} className="mb-12 flex flex-col gap-6 sm:flex-row">
            <span className="inline-flex items-center gap-2.5 text-lg font-semibold text-accent">
              <Briefcase className="h-5 w-5" />
              Hire Talent
            </span>
            <span className="inline-flex items-center gap-2.5 text-lg font-semibold text-white">
              <Users className="h-5 w-5" />
              Find Work
            </span>
          </motion.div>

          <motion.div {...fadeUp(0.4)} className="mb-14 flex flex-wrap gap-4">
            {["No commission fees", "Verified professionals", "Secure payments"].map((feature) => (
              <span key={feature} className="flex items-center gap-1.5 text-[15px] text-white">
                <CheckCircle2 className="h-4 w-4 flex-shrink-0 text-white" />
                {feature}
              </span>
            ))}
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.55 }}
            className="flex gap-10 border-t border-white/10 pt-8"
          >
            {[
              { value: "50K+", label: "Freelancers" },
              { value: "12K+", label: "Companies" },
              { value: "98%", label: "Satisfaction" },
            ].map((stat) => (
              <div key={stat.label}>
                <div className="text-3xl font-display font-bold text-white">{stat.value}</div>
                <div className="mt-0.5 text-[15px] text-white">{stat.label}</div>
              </div>
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
