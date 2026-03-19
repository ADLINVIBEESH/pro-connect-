import { motion, useScroll, useTransform } from "framer-motion";
import { Star, Quote } from "lucide-react";
import { useRef } from "react";
import { testimonials } from "@/data/mockData";

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.1 } },
};
const item = {
  hidden: { opacity: 0, y: 32, scale: 0.96 },
  show: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.55, ease: "easeOut" as const } },
};

const Testimonials = () => {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const bgScale = useTransform(scrollYProgress, [0, 1], [1.05, 0.95]);

  return (
    <section ref={ref} id="testimonials" className="py-32 relative overflow-hidden">
      <motion.div style={{ scale: bgScale }} className="absolute inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-b from-background to-muted/40" />
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[700px] h-[400px] orb bg-secondary/6" />
      </motion.div>

      <div className="relative container mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="text-center mb-16"
        >
          <span className="inline-block text-xs font-bold text-secondary uppercase tracking-widest mb-4 px-4 py-1.5 rounded-full bg-secondary/10 border border-secondary/20">
            Testimonials
          </span>
          <h2 className="text-4xl md:text-5xl font-display font-bold text-foreground mt-2 tracking-tight">
            Loved by Thousands
          </h2>
          <p className="text-muted-foreground mt-4 max-w-md mx-auto">
            Real feedback from real professionals using ProConnect every day.
          </p>
        </motion.div>

        <motion.div
          variants={container}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-60px" }}
          className="grid md:grid-cols-3 gap-5 max-w-5xl mx-auto"
        >
          {testimonials.map((t, i) => (
            <motion.div
              key={t.name}
              variants={item}
              whileHover={{ y: -6, scale: 1.01, transition: { duration: 0.25 } }}
              className="group p-7 rounded-3xl bg-card/90 card-shadow border border-border hover:border-secondary/30 transition-all duration-300 flex flex-col relative overflow-hidden backdrop-blur-sm"
            >
              {/* Background gradient on hover */}
              <motion.div
                className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-3xl"
                style={{ background: "linear-gradient(135deg, hsl(160 84% 39% / 0.03), transparent 70%)" }}
              />

              <div className="relative">
                <Quote className="w-8 h-8 text-secondary/25 mb-4 flex-shrink-0" />
                <p className="text-foreground mb-6 text-sm leading-relaxed flex-1">"{t.quote}"</p>
                <div className="flex gap-1 mb-5">
                  {Array.from({ length: t.rating }).map((_, j) => (
                    <Star key={j} className="w-3.5 h-3.5 fill-accent text-accent" />
                  ))}
                </div>
                <div className="flex items-center gap-3 pt-5 border-t border-border">
                  <div className="relative">
                    <img src={t.avatar} alt={t.name} className="w-10 h-10 rounded-xl bg-muted object-cover" />
                    <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-secondary border-2 border-card" />
                  </div>
                  <div>
                    <div className="font-semibold text-sm text-foreground">{t.name}</div>
                    <div className="text-xs text-muted-foreground">{t.role}</div>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};

export default Testimonials;
