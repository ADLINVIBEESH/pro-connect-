import { motion } from "framer-motion";
import { Monitor, Server, Smartphone, Palette, BarChart3, Shield, Cloud, Brain } from "lucide-react";
import { categories } from "@/data/mockData";

const iconMap: Record<string, React.ReactNode> = {
  Monitor: <Monitor className="h-6 w-6" />,
  Server: <Server className="h-6 w-6" />,
  Smartphone: <Smartphone className="h-6 w-6" />,
  Palette: <Palette className="h-6 w-6" />,
  BarChart3: <BarChart3 className="h-6 w-6" />,
  Shield: <Shield className="h-6 w-6" />,
  Cloud: <Cloud className="h-6 w-6" />,
  Brain: <Brain className="h-6 w-6" />,
};

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.07 } },
};

const item = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.45 } },
};

const Categories = () => {
  return (
    <section id="categories" className="bg-background py-28">
      <div className="container mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="mb-16 text-center"
        >
          <span className="mb-4 inline-block rounded-full bg-secondary/10 px-3 py-1 text-sm font-bold uppercase tracking-widest text-secondary">
            Browse Talent
          </span>
          <h2 className="mt-2 text-4xl font-display font-bold tracking-[0.015em] text-foreground md:text-5xl">
            Explore by Category
          </h2>
          <p className="mx-auto mt-4 max-w-md text-[18px] leading-8 tracking-[0.012em] text-muted-foreground">
            Find specialists across every domain of technology and design.
          </p>
        </motion.div>

        <motion.div
          variants={container}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
          className="grid grid-cols-2 gap-4 md:grid-cols-4"
        >
          {categories.map((cat) => (
            <motion.div
              key={cat.id}
              variants={item}
              whileHover={{ y: -4, transition: { duration: 0.2 } }}
              className="group cursor-pointer rounded-2xl border border-border bg-card p-6 card-shadow transition-all duration-300 hover:border-secondary/30 hover:card-shadow-hover"
            >
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-secondary/10 text-secondary transition-all duration-300 group-hover:scale-110 group-hover:bg-secondary group-hover:text-secondary-foreground">
                {iconMap[cat.icon]}
              </div>
              <h3 className="text-[15px] font-display font-semibold text-foreground">{cat.label}</h3>
              <p className="mt-1 text-sm text-muted-foreground transition-colors group-hover:text-secondary">
                Browse experts {"->"}
              </p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};

export default Categories;
