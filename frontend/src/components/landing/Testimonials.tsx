import { motion } from "framer-motion";
import { Star, Quote } from "lucide-react";
import { testimonials } from "@/data/mockData";

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.1 } },
};
const item = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

const Testimonials = () => {
  return (
    <section id="testimonials" className="py-28 bg-background">
      <div className="container mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-16"
        >
          <span className="inline-block text-xs font-bold text-secondary uppercase tracking-widest mb-4 px-3 py-1 rounded-full bg-secondary/10">
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
          viewport={{ once: true }}
          className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto"
        >
          {testimonials.map((t) => (
            <motion.div
              key={t.name}
              variants={item}
              whileHover={{ y: -4, transition: { duration: 0.2 } }}
              className="p-7 rounded-2xl bg-card card-shadow hover:card-shadow-hover border border-border transition-all duration-300 flex flex-col"
            >
              <Quote className="w-8 h-8 text-secondary/30 mb-4 flex-shrink-0" />
              <p className="text-foreground mb-6 text-sm leading-relaxed flex-1">"{t.quote}"</p>
              <div className="flex gap-1 mb-4">
                {Array.from({ length: t.rating }).map((_, j) => (
                  <Star key={j} className="w-3.5 h-3.5 fill-accent text-accent" />
                ))}
              </div>
              <div className="flex items-center gap-3 pt-4 border-t border-border">
                <img src={t.avatar} alt={t.name} className="w-10 h-10 rounded-xl bg-muted object-cover" />
                <div>
                  <div className="font-semibold text-sm text-foreground">{t.name}</div>
                  <div className="text-xs text-muted-foreground">{t.role}</div>
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
