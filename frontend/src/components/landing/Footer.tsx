import { motion } from "framer-motion";
import { Zap, Twitter, Linkedin, Github, ArrowUpRight } from "lucide-react";

const Footer = () => {
  return (
    <footer className="relative overflow-hidden">
      {/* Liquid glass dark surface */}
      <div className="absolute inset-0 bg-gradient-to-b from-primary/95 to-primary" />
      <div className="absolute top-0 left-1/4 w-96 h-96 orb bg-secondary/10 pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-80 h-80 orb bg-accent/8 pointer-events-none" />
      {/* Top glass edge */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary-foreground/10 to-transparent" />

      <div className="relative container mx-auto px-6 py-20">
        <div className="grid md:grid-cols-4 gap-10 mb-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="md:col-span-2"
          >
            <div className="flex items-center gap-2.5 mb-5">
              <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center shadow-lg shadow-secondary/30">
                <Zap className="w-5 h-5 text-secondary-foreground" />
              </div>
              <span className="text-xl font-display font-bold text-primary-foreground">ProConnect</span>
            </div>
            <p className="text-primary-foreground/45 text-sm leading-relaxed max-w-xs mb-6">
              The professional marketplace where businesses meet world-class freelance talent.
            </p>
            <div className="flex items-center gap-2">
              {[Twitter, Linkedin, Github].map((Icon, i) => (
                <motion.a
                  key={i}
                  href="#"
                  whileHover={{ scale: 1.1, y: -2 }}
                  className="w-9 h-9 rounded-xl glass flex items-center justify-center transition-all duration-200 hover:bg-primary-foreground/10"
                >
                  <Icon className="w-4 h-4 text-primary-foreground/50 hover:text-primary-foreground transition-colors" />
                </motion.a>
              ))}
            </div>
          </motion.div>

          {[
            {
              title: "Platform",
              links: ["Find Talent", "Find Work", "How It Works", "Pricing"],
            },
            {
              title: "Company",
              links: ["About", "Blog", "Privacy", "Terms"],
            },
          ].map((col, ci) => (
            <motion.div
              key={col.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.1 * (ci + 1) }}
            >
              <h4 className="text-xs font-bold text-primary-foreground/50 mb-5 uppercase tracking-widest">{col.title}</h4>
              <ul className="space-y-3">
                {col.links.map((l) => (
                  <li key={l}>
                    <a
                      href="#"
                      className="group flex items-center gap-1 text-sm text-primary-foreground/40 hover:text-primary-foreground transition-colors duration-200"
                    >
                      {l}
                      <ArrowUpRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity -translate-y-0.5 translate-x-0.5" />
                    </a>
                  </li>
                ))}
              </ul>
            </motion.div>
          ))}
        </div>

        <div className="flex flex-col md:flex-row items-center justify-between pt-8 border-t border-primary-foreground/8 gap-4">
          <p className="text-xs text-primary-foreground/25">© 2026 ProConnect. All rights reserved.</p>
          <div className="flex items-center gap-3">
            <span className="w-2 h-2 rounded-full bg-secondary animate-pulse-glow" />
            <span className="text-xs text-primary-foreground/30">All systems operational</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
