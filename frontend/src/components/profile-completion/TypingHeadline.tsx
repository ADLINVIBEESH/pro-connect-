import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface TypingHeadlineProps {
  text: string;
  className?: string;
  speedMs?: number;
  onComplete?: () => void;
}

const TypingHeadline = ({ text, className, speedMs = 8, onComplete }: TypingHeadlineProps) => {
  const [visibleCharacters, setVisibleCharacters] = useState(0);
  const onCompleteRef = useRef(onComplete);
  const completionFiredRef = useRef(false);

  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  useEffect(() => {
    setVisibleCharacters(0);
    completionFiredRef.current = false;

    const instantMode = import.meta.env.MODE === "test";
    const reduceMotion =
      typeof window !== "undefined" && Boolean(window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches);
    if (instantMode || reduceMotion) {
      setVisibleCharacters(text.length);
      return;
    }

    const intervalId = window.setInterval(() => {
      setVisibleCharacters((previous) => {
        if (previous >= text.length) {
          window.clearInterval(intervalId);
          return previous;
        }

        const next = previous + 1;
        if (next >= text.length) {
          window.clearInterval(intervalId);
        }

        return next;
      });
    }, speedMs);

    return () => window.clearInterval(intervalId);
  }, [speedMs, text]);

  useEffect(() => {
    if (completionFiredRef.current || visibleCharacters < text.length) return;

    completionFiredRef.current = true;
    onCompleteRef.current?.();
  }, [text, visibleCharacters]);

  const typedText = text.slice(0, visibleCharacters);

  return (
    <span className={cn("inline", className)} aria-label={text}>
      {typedText}
      <motion.span
        aria-hidden="true"
        animate={{ opacity: [1, 0.2, 1] }}
        transition={{ duration: 0.9, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
        className="ml-1 inline-block h-[0.9em] w-[2px] rounded-full bg-[#ff9e43] align-[-0.12em]"
      />
    </span>
  );
};

export default TypingHeadline;
