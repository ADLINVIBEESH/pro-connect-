import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Zap, Menu, X } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useState, useEffect } from "react";

const Navbar = () => {
  const { isAuthenticated, user } = useAuth();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <motion.nav
      initial={{ y: -60, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className={`fixed z-50 transition-[top,left,right,border-radius,background-color,box-shadow,backdrop-filter] duration-500 ${
        scrolled
          ? "left-3 right-3 top-2 rounded-lg border border-white/12 bg-black/45 backdrop-blur-xl shadow-none"
          : "left-0 right-0 top-0 bg-transparent"
      }`}
    >
      <div className={`container mx-auto flex items-center justify-between px-6 transition-[padding] duration-300 ${scrolled ? "py-2" : "py-3"}`}>
        <Link to="/" className="flex items-center gap-2.5 group">
          <div
            className={`flex h-9 w-9 items-center justify-center rounded-xl bg-secondary transition-all duration-300 group-hover:scale-105 ${
              scrolled ? "shadow-md ring-1 ring-secondary/35" : "shadow-sm"
            }`}
          >
            <Zap className="w-5 h-5 text-secondary-foreground" />
          </div>
          <span className={`text-xl font-display font-bold transition-colors duration-300 ${scrolled ? "text-white" : "text-white"}`}>
            ProConnect
          </span>
        </Link>

        <div className="hidden md:flex items-center gap-8 text-sm font-medium">
          {[["#categories", "Talent"], ["#how-it-works", "How It Works"], ["#testimonials", "Reviews"]].map(([href, label]) => (
            <a
              key={label}
              href={href}
              className={`relative transition-colors after:absolute after:bottom-0 after:left-0 after:h-0.5 after:w-0 after:bg-secondary after:transition-all hover:after:w-full ${
                scrolled ? "text-white/80 hover:text-white" : "text-white/72 hover:text-white"
              }`}
            >
              {label}
            </a>
          ))}
        </div>

        <div className="hidden md:flex items-center gap-3">
          {isAuthenticated ? (
            <Link
              to={user?.role === "client" ? "/client-dashboard" : "/dashboard"}
              className={`rounded-xl bg-secondary px-5 py-2.5 text-sm font-semibold text-secondary-foreground transition-all hover:opacity-90 ${
                scrolled ? "shadow-md" : "shadow-sm"
              }`}
            >
              Dashboard
            </Link>
          ) : (
            <>
              <Link
                to="/login"
                className={`rounded-xl px-4 py-2.5 text-sm font-medium transition-all ${
                  scrolled
                    ? "text-white/85 hover:bg-white/12 hover:text-white"
                    : "text-white/82 hover:bg-white/10 hover:text-white"
                }`}
              >
                Log In
              </Link>
              <Link
                to="/signup"
                className={`rounded-xl bg-accent px-5 py-2.5 text-sm font-semibold text-accent-foreground transition-all hover:opacity-90 ${
                  scrolled ? "shadow-md hover:shadow-lg" : "shadow-sm hover:shadow-md"
                }`}
              >
                Get Started
              </Link>
            </>
          )}
        </div>

        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className={`rounded-lg p-2 transition-colors md:hidden ${
            scrolled
              ? "text-white/85 hover:bg-white/12 hover:text-white"
              : "text-white/82 hover:bg-white/10 hover:text-white"
          }`}
        >
          {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className={`space-y-3 border-t px-6 py-4 md:hidden ${scrolled ? "border-white/20 bg-black/85 text-white" : "border-border/70 bg-card/95"}`}
        >
          {[["#categories", "Talent"], ["#how-it-works", "How It Works"], ["#testimonials", "Reviews"]].map(([href, label]) => (
            <a
              key={label}
              href={href}
              onClick={() => setMobileOpen(false)}
              className={`block py-2 text-sm font-medium ${scrolled ? "text-white/80 hover:text-white" : "text-muted-foreground hover:text-foreground"}`}
            >
              {label}
            </a>
          ))}
          <div className={`flex gap-2 border-t pt-2 ${scrolled ? "border-white/20" : "border-border"}`}>
            <Link
              to="/login"
              className={`flex-1 rounded-xl py-2.5 text-center text-sm font-medium transition-colors ${
                scrolled ? "text-white hover:bg-white/12" : "text-foreground hover:bg-muted"
              }`}
            >
              Log In
            </Link>
            <Link to="/signup" className="flex-1 text-center py-2.5 rounded-xl bg-accent text-accent-foreground text-sm font-semibold">
              Get Started
            </Link>
          </div>
        </motion.div>
      )}
    </motion.nav>
  );
};

export default Navbar;
