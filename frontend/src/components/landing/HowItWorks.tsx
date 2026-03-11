import { motion } from "framer-motion";
import { UserPlus, Search, Handshake } from "lucide-react";

const steps = [
  {
    icon: <UserPlus className="w-7 h-7" />,
    title: "Create Account",
    description: "Sign up in seconds and tell us if you're here to hire or work.",
    color: "bg-secondary text-secondary-foreground",
    glow: "shadow-[0_8px_30px_hsl(160_84%_39%/0.25)]",
  },
  {
    icon: <Search className="w-7 h-7" />,
    title: "Post or Browse",
    description: "Hirers post projects, freelancers browse opportunities that match their skills.",
    color: "bg-accent text-accent-foreground",
    glow: "shadow-[0_8px_30px_hsl(25_95%_53%/0.25)]",
  },
  {
    icon: <Handshake className="w-7 h-7" />,
    title: "Connect & Build",
    description: "Match with the perfect partner and start collaborating immediately.",
    color: "bg-primary text-primary-foreground",
    glow: "shadow-[0_8px_30px_hsl(222_60%_18%/0.20)]",
  },
];

const HowItWorks = () => {
  return (
    <section id="how-it-works" className="py-28 bg-muted/40">
      <div className="container mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-16"
        >
          <span className="inline-block text-xs font-bold text-accent uppercase tracking-widest mb-4 px-3 py-1 rounded-full bg-accent/10">
            Simple Process
          </span>
          <h2 className="text-4xl md:text-5xl font-display font-bold text-foreground mt-2 tracking-tight">
            How It Works
          </h2>
          <p className="text-muted-foreground mt-4 max-w-md mx-auto">
            Three simple steps to start hiring or earning today.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto relative">
          {/* Connector line */}
          <div className="hidden md:block absolute top-8 left-1/4 right-1/4 h-px bg-gradient-to-r from-secondary via-accent to-primary opacity-30" />

          {steps.map((step, i) => (
            <motion.div
              key={step.title}
              initial={{ opacity: 0, y: 28 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.15, duration: 0.5, ease: "easeOut" }}
              className="relative text-center group"
            >
              <div className="relative inline-block mb-6">
                <div className={`w-16 h-16 rounded-2xl ${step.color} ${step.glow} flex items-center justify-center mx-auto group-hover:scale-110 transition-transform duration-300`}>
                  {step.icon}
                </div>
                <span className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-background border-2 border-border text-xs font-bold text-foreground flex items-center justify-center">
                  {i + 1}
                </span>
              </div>
              <h3 className="text-xl font-display font-semibold text-foreground mb-3">{step.title}</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">{step.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
