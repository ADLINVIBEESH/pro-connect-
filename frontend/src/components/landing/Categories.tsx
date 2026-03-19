import { motion, useScroll, useTransform } from "framer-motion";
import { Monitor, Server, Smartphone, Palette, BarChart3, Shield, Cloud, Brain } from "lucide-react";
import { useRef } from "react";
import { categories } from "@/data/mockData";

const iconMap: Record<string, React.ReactNode> = {
  Monitor: <Monitor className="w-6 h-6" />,
  Server: <Server className="w-6 h-6" />,
  Smartphone: <Smartphone className="w-6 h-6" />,
  Palette: <Palette className="w-6 h-6" />,
  BarChart3: <BarChart3 className="w-6 h-6" />,
  Shield: <Shield className="w-6 h-6" />,
  Cloud: <Cloud className="w-6 h-6" />,
  Brain: <Brain className="w-6 h-6" />,
};

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.06 } },
};
const item = {
  hidden: { opacity: 0, y: 32, scale: 0.94 },
  show: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.5, ease: "easeOut" as const } },
};

const Categories = () => {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const bgY = useTransform(scrollYProgress, [0, 1], [-40, 40]);

  return (
    <section ref={ref} id="categories" className="py-32 relative overflow-hidden">
      {/* Animated background */}
      <motion.div style={{ y: bgY }} className="absolute inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-b from-background via-muted/30 to-background" />
        <div className="absolute top-20 left-1/4 w-96 h-96 orb bg-secondary/8" />
        <div className="absolute bottom-20 right-1/4 w-80 h-80 orb bg-accent/6" />
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
            Browse Talent
          </span>
          <h2 className="text-4xl md:text-5xl font-display font-bold text-foreground mt-2 tracking-tight">
            Explore by Category
          </h2>
          <p className="text-muted-foreground mt-4 max-w-md mx-auto text-base">
            Find specialists across every domain of technology and design.
          </p>
        </motion.div>

        <motion.div
          variants={container}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-60px" }}
          className="grid grid-cols-2 md:grid-cols-4 gap-4"
        >
          {categories.map((cat) => (
            <motion.div
              key={cat.id}
              variants={item}
              whileHover={{ y: -6, scale: 1.02, transition: { duration: 0.25, ease: "easeOut" } }}
              className="group p-6 rounded-2xl bg-card/80 card-shadow hover:card-shadow-hover border border-border hover:border-secondary/30 cursor-pointer transition-all duration-300 backdrop-blur-sm relative overflow-hidden"
            >
              {/* Hover shimmer */}
              <motion.div
                className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                style={{
                  background: "linear-gradient(135deg, hsl(160 84% 39% / 0.04) 0%, transparent 60%)",
                }}
              />
              <div className="relative">
                <div className="w-12 h-12 rounded-xl bg-secondary/10 text-secondary flex items-center justify-center mb-4 group-hover:bg-secondary group-hover:text-secondary-foreground transition-all duration-300 group-hover:scale-110 group-hover:rotate-3">
                  {iconMap[cat.icon]}
                </div>
                <h3 className="font-display font-semibold text-foreground text-sm">{cat.label}</h3>
                <p className="text-xs text-muted-foreground mt-1 group-hover:text-secondary transition-colors duration-300">
                  Browse experts →
                </p>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};

export default Categories;
