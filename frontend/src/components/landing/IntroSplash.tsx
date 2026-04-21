import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";

interface IntroSplashProps {
  onComplete?: () => void;
  /** Film grain intensity 0–1 (default 0.2) */
  grain?: number;
  /** Vignette darkness 0–1 (default 0.45) */
  vignette?: number;
}

const TEXT = "PROCONNECT";
const TOTAL_MS = 3600;

const IntroSplash = ({ onComplete, grain = 0.2, vignette = 0.45 }: IntroSplashProps) => {
  const [show, setShow] = useState(true);
  const g = Math.max(0, Math.min(1, grain));
  const v = Math.max(0, Math.min(1, vignette));
  const vignetteOuter = 0.45 + v * 0.4;
  const vignetteInner = 50 - v * 20;
  const grainSvg = encodeURIComponent(
    `<svg xmlns='http://www.w3.org/2000/svg' width='160' height='160'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/><feColorMatrix type='matrix' values='0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 0.5 0'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>`
  );

  useEffect(() => {
    const t = setTimeout(() => {
      setShow(false);
      onComplete?.();
    }, TOTAL_MS);
    return () => clearTimeout(t);
  }, [onComplete]);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          exit={{ opacity: 0, filter: "blur(20px)" }}
          transition={{ duration: 0.8, ease: "easeInOut" }}
          className="fixed inset-0 z-[100] overflow-hidden flex items-center justify-center"
          style={{ background: "hsl(195 60% 6%)" }}
        >
          {/* Aurora layer 1 — cyan */}
          <motion.div
            initial={{ opacity: 0, x: "-30%", y: "-20%", scale: 1.2 }}
            animate={{ opacity: [0, 0.9, 0.7], x: ["-30%", "10%", "-5%"], y: ["-20%", "10%", "0%"] }}
            transition={{ duration: 4, ease: "easeInOut", times: [0, 0.5, 1] }}
            className="absolute inset-0 pointer-events-none"
            style={{
              background:
                "radial-gradient(ellipse 55% 50% at 30% 40%, hsl(180 90% 55% / 0.55) 0%, transparent 65%)",
              filter: "blur(60px)",
            }}
          />
          {/* Aurora layer 2 — violet */}
          <motion.div
            initial={{ opacity: 0, x: "30%", y: "20%", scale: 1.2 }}
            animate={{ opacity: [0, 0.85, 0.7], x: ["30%", "-10%", "5%"], y: ["20%", "-5%", "0%"] }}
            transition={{ duration: 4.4, ease: "easeInOut", delay: 0.1, times: [0, 0.5, 1] }}
            className="absolute inset-0 pointer-events-none"
            style={{
              background:
                "radial-gradient(ellipse 55% 50% at 70% 60%, hsl(265 90% 65% / 0.55) 0%, transparent 65%)",
              filter: "blur(70px)",
            }}
          />
          {/* Aurora layer 3 — mint accent */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: [0, 0.5, 0.4], scale: [0.9, 1.15, 1.05] }}
            transition={{ duration: 4, ease: "easeInOut", delay: 0.3 }}
            className="absolute inset-0 pointer-events-none"
            style={{
              background:
                "radial-gradient(ellipse 40% 30% at 50% 50%, hsl(155 80% 60% / 0.45) 0%, transparent 70%)",
              filter: "blur(80px)",
            }}
          />

          {/* Vignette */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background: `radial-gradient(ellipse at center, transparent ${vignetteInner}%, rgba(0,10,20,${vignetteOuter}) 100%)`,
            }}
          />

          {/* Grain */}
          {g > 0 && (
            <motion.div
              animate={{ x: [0, -5, 4, -3, 0], y: [0, 4, -4, 3, 0] }}
              transition={{ duration: 0.7, repeat: Infinity, ease: "linear" }}
              className="absolute inset-[-10%] pointer-events-none mix-blend-overlay"
              style={{
                opacity: g * 0.5,
                backgroundImage: `url("data:image/svg+xml;utf8,${grainSvg}")`,
                backgroundSize: "160px 160px",
              }}
            />
          )}

          {/* Frosted glass card behind text */}
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 1, ease: [0.22, 1, 0.36, 1], delay: 0.2 }}
            className="absolute rounded-[2rem] border border-white/15"
            style={{
              width: "min(90vw, 980px)",
              height: "min(38vh, 280px)",
              background:
                "linear-gradient(135deg, hsl(0 0% 100% / 0.08), hsl(0 0% 100% / 0.02))",
              boxShadow:
                "inset 0 1px 0 hsl(0 0% 100% / 0.25), 0 30px 80px hsl(195 80% 5% / 0.6)",
            }}
          />

          {/* Text — staggered fade + rise with blur-to-sharp */}
          <h1
            className="relative font-display font-bold tracking-tight text-5xl sm:text-7xl md:text-8xl lg:text-9xl select-none flex"
            aria-label={TEXT}
            style={{ color: "hsl(190 100% 95%)" }}
          >
            {TEXT.split("").map((char, i) => (
              <motion.span
                key={i}
                initial={{ opacity: 0, y: 40, filter: "blur(14px)" }}
                animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                transition={{
                  duration: 0.9,
                  delay: 0.4 + i * 0.07,
                  ease: [0.22, 1, 0.36, 1],
                }}
                className="inline-block"
                style={{
                  textShadow:
                    "0 0 30px hsl(180 100% 70% / 0.55), 0 0 60px hsl(265 90% 70% / 0.35)",
                }}
              >
                {char}
              </motion.span>
            ))}
          </h1>

          {/* Subtle bottom shimmer line */}
          <motion.div
            initial={{ scaleX: 0, opacity: 0 }}
            animate={{ scaleX: 1, opacity: 0.8 }}
            transition={{ duration: 1.4, delay: 1.2, ease: [0.22, 1, 0.36, 1] }}
            className="absolute bottom-[34%] h-px w-[min(70vw,640px)] origin-left"
            style={{
              background:
                "linear-gradient(90deg, transparent, hsl(180 100% 75% / 0.8), hsl(265 90% 75% / 0.8), transparent)",
            }}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default IntroSplash;
