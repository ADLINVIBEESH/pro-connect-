import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Zap, Menu, X } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useState, useEffect } from "react";

const Navbar = () => {
  const { isAuthenticated } = useAuth();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Over dark hero → white text. Scrolled glass pill → dark foreground text
  const textColor = scrolled ? "text-foreground" : "text-primary-foreground";
  const mutedText = scrolled ? "text-muted-foreground hover:text-foreground" : "text-primary-foreground/75 hover:text-primary-foreground";
  const loginColor = scrolled
    ? "text-foreground/70 hover:text-foreground hover:bg-foreground/8"
    : "text-primary-foreground/80 hover:text-primary-foreground hover:bg-primary-foreground/10";

  return (
    <motion.nav
      initial={{ y: -80, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        scrolled
          ? "bg-white/80 backdrop-blur-2xl border border-border/60 shadow-sm mx-3 mt-3 rounded-2xl"
          : "bg-transparent"
      }`}
    >
      <div className="container mx-auto px-6 py-3.5 flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2.5 group">
          <div className="w-9 h-9 rounded-xl bg-secondary flex items-center justify-center shadow-sm group-hover:scale-110 group-hover:rotate-6 transition-all duration-300">
            <Zap className="w-5 h-5 text-secondary-foreground" />
          </div>
          <span className={`text-xl font-display font-bold transition-colors duration-300 ${textColor}`}>
            ProConnect
          </span>
        </Link>

        {/* Nav links */}
        <div className="hidden md:flex items-center gap-8 text-sm font-medium">
          {[["#categories", "Talent"], ["#how-it-works", "How It Works"], ["#testimonials", "Reviews"]].map(([href, label]) => (
            <a
              key={label}
              href={href}
              className={`transition-all duration-200 relative after:absolute after:bottom-0 after:left-0 after:w-0 after:h-0.5 after:bg-secondary after:transition-all after:duration-300 hover:after:w-full ${mutedText}`}
            >
              {label}
            </a>
          ))}
        </div>

        {/* Actions */}
        <div className="hidden md:flex items-center gap-3">
          {isAuthenticated ? (
            <Link
              to="/dashboard"
              className={`px-5 py-2.5 rounded-xl text-sm font-semibold border transition-all duration-300 ${
                scrolled
                  ? "border-border text-foreground hover:bg-muted"
                  : "glass text-primary-foreground border-white/20 hover:bg-white/20"
              }`}
            >
              Dashboard
            </Link>
          ) : (
            <>
              <Link
                to="/login"
                className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${loginColor}`}
              >
                Log In
              </Link>
              <Link
                to="/signup"
                className="px-5 py-2.5 rounded-xl bg-secondary text-secondary-foreground text-sm font-semibold hover:opacity-90 transition-all duration-300 shadow-sm hover:shadow-lg hover:shadow-secondary/25 hover:-translate-y-0.5"
              >
                Get Started
              </Link>
            </>
          )}
        </div>

        {/* Mobile toggle */}
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className={`md:hidden p-2 rounded-xl transition-all duration-200 ${
            scrolled ? "text-foreground hover:bg-muted" : "text-primary-foreground/80 glass hover:bg-primary-foreground/10"
          }`}
        >
          <AnimatePresence mode="wait">
            {mobileOpen ? (
              <motion.div key="x" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }} transition={{ duration: 0.2 }}>
                <X className="w-5 h-5" />
              </motion.div>
            ) : (
              <motion.div key="menu" initial={{ rotate: 90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -90, opacity: 0 }} transition={{ duration: 0.2 }}>
                <Menu className="w-5 h-5" />
              </motion.div>
            )}
          </AnimatePresence>
        </button>
      </div>

      {/* Mobile menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="md:hidden overflow-hidden"
          >
            <div className={`border-t px-6 py-5 space-y-3 mx-3 mb-3 rounded-b-2xl ${scrolled ? "bg-white/95 border-border" : "glass-strong border-white/10"}`}>
              {[["#categories", "Talent"], ["#how-it-works", "How It Works"], ["#testimonials", "Reviews"]].map(([href, label], i) => (
                <motion.a
                  key={label}
                  href={href}
                  onClick={() => setMobileOpen(false)}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.07 }}
                  className={`block text-sm font-medium py-2 transition-colors ${scrolled ? "text-foreground/70 hover:text-foreground" : "text-primary-foreground/80 hover:text-primary-foreground"}`}
                >
                  {label}
                </motion.a>
              ))}
              <div className={`flex gap-2 pt-3 border-t ${scrolled ? "border-border" : "border-white/10"}`}>
                <Link to="/login" className={`flex-1 text-center py-2.5 rounded-xl text-sm font-medium transition-colors ${scrolled ? "text-foreground hover:bg-muted border border-border" : "glass text-primary-foreground hover:bg-white/10"}`}>
                  Log In
                </Link>
                <Link to="/signup" className="flex-1 text-center py-2.5 rounded-xl bg-secondary text-secondary-foreground text-sm font-semibold">
                  Get Started
                </Link>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  );
};

export default Navbar;
