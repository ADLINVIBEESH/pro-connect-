import {
  motion,
  type MotionValue,
  useMotionValueEvent,
  useReducedMotion,
  useScroll,
  useTransform,
} from "framer-motion";
import { useEffect, useRef, useState } from "react";
import imageOne from "@/assets/HomePage Images/image 1.1.jpg";
import imageThree from "@/assets/HomePage Images/image 1.3.jpg";
import videoOne from "@/assets/HomePage Videos/Video 1.1.mp4";

type ShowcaseMediaType = "image" | "video";

type ShowcaseItem = {
  id: string;
  eyebrow: string;
  title: string;
  description: string;
  highlights: string[];
  mediaSrc: string;
  mediaType: ShowcaseMediaType;
  alt: string;
  reverse: boolean;
  isPrimary: boolean;
};

const showcaseItems: ShowcaseItem[] = [
  {
    id: "portfolio-impact",
    eyebrow: "Portfolio Impact",
    title: "Present your best work so clients trust you quickly",
    description:
      "Turn portfolio views into serious inquiries by showing outcomes, tools, and delivery clarity.",
    highlights: ["Results-focused case studies", "Clear visual storytelling", "Stronger first impression"],
    mediaSrc: imageOne,
    mediaType: "image",
    alt: "Freelancer portfolio presentation with project outcomes",
    reverse: false,
    isPrimary: true,
  },
  {
    id: "smarter-applications",
    eyebrow: "Smarter Applications",
    title: "Send focused proposals that win shortlists",
    description:
      "Match each application to project goals with relevant examples and concise communication.",
    highlights: ["Tailored proposal quality", "Higher shortlist rate", "Faster client replies"],
    mediaSrc: videoOne,
    mediaType: "video",
    alt: "Freelancer sending focused proposals for client projects",
    reverse: true,
    isPrimary: false,
  },
  {
    id: "professional-delivery",
    eyebrow: "Professional Delivery",
    title: "Deliver smoothly and build repeat-client momentum",
    description:
      "Keep progress visible, hand off cleanly, and collect feedback that strengthens future opportunities.",
    highlights: ["Transparent updates", "Clean final handoff", "Ratings that compound trust"],
    mediaSrc: imageThree,
    mediaType: "image",
    alt: "Freelancer sharing final delivery and client feedback",
    reverse: false,
    isPrimary: false,
  },
];

const textContainerVariants = {
  hidden: {},
  show: {
    transition: {
      staggerChildren: 0.11,
      delayChildren: 0.04,
    },
  },
};

const createTextItemVariants = (reduceMotion: boolean) => ({
  hidden: {
    opacity: 0,
    x: reduceMotion ? 0 : 40,
  },
  show: {
    opacity: 1,
    x: 0,
    transition: {
      duration: reduceMotion ? 0.38 : 0.62,
      ease: [0.22, 1, 0.36, 1] as const,
    },
  },
});

type TypedTextProps = {
  as?: "p" | "h2" | "h3" | "span";
  text: string;
  progress: MotionValue<number>;
  start: number;
  end: number;
  className?: string;
};

const TypedText = ({ as = "p", text, progress, start, end, className }: TypedTextProps) => {
  const reduceMotion = useReducedMotion();
  const [visibleChars, setVisibleChars] = useState(reduceMotion ? text.length : 0);
  const charCount = useTransform(progress, [start, end], [0, text.length]);

  useEffect(() => {
    setVisibleChars(reduceMotion ? text.length : 0);
  }, [reduceMotion, text]);

  useMotionValueEvent(charCount, "change", (latest) => {
    if (reduceMotion) return;
    const next = Math.max(0, Math.min(text.length, Math.round(latest)));
    setVisibleChars((prev) => (next > prev ? next : prev));
  });

  const Tag = as;
  const typedValue = text.slice(0, visibleChars);
  const done = visibleChars >= text.length;

  return (
    <Tag className={className}>
      {typedValue}
      {!reduceMotion && !done ? (
        <span aria-hidden="true" className="ml-0.5 inline-block h-[1em] w-[2px] translate-y-[1px] animate-pulse bg-current align-middle" />
      ) : null}
    </Tag>
  );
};

type ShowcaseRowProps = {
  item: ShowcaseItem;
};

const ShowcaseRow = ({ item }: ShowcaseRowProps) => {
  const rowRef = useRef<HTMLElement | null>(null);
  const reduceMotion = useReducedMotion();
  const { scrollYProgress } = useScroll({
    target: rowRef,
    offset: ["start 0.9", "end 0.16"],
  });

  const textX = useTransform(
    scrollYProgress,
    [0, 0.24, 1],
    [reduceMotion ? 0 : 340, 0, 0]
  );
  const textOpacity = useTransform(scrollYProgress, [0, 0.18, 1], [0, 1, 1]);

  const imageY = useTransform(scrollYProgress, [0, 1], [reduceMotion ? 0 : 24, reduceMotion ? 0 : -18]);
  const imageOpacity = useTransform(scrollYProgress, [0, 0.2, 1], [0.6, 1, 0.88]);
  const imageScale = useTransform(scrollYProgress, [0, 0.5, 1], [0.985, 1, 1.012]);
  const textItemVariants = createTextItemVariants(reduceMotion);

  return (
    <motion.article
      ref={rowRef}
      style={{
        minHeight: item.isPrimary ? "clamp(540px, 78vh, 920px)" : "clamp(440px, 64vh, 760px)",
      }}
      className="grid items-stretch gap-8 md:grid-cols-12 md:gap-12"
    >
      <motion.div
        style={{
          y: reduceMotion ? 0 : imageY,
          opacity: imageOpacity,
          scale: reduceMotion ? 1 : imageScale,
          willChange: "transform, opacity",
        }}
        className={`flex h-full items-center justify-center md:col-span-7 ${item.reverse ? "md:order-2" : ""}`}
      >
        {item.mediaType === "video" ? (
          <video
            className="h-full w-full object-contain"
            autoPlay
            muted
            loop
            playsInline
            preload="metadata"
            aria-label={item.alt}
          >
            <source src={item.mediaSrc} type="video/mp4" />
          </video>
        ) : (
          <img src={item.mediaSrc} alt={item.alt} loading="lazy" className="h-full w-full object-contain" />
        )}
      </motion.div>

      <motion.div
        variants={textContainerVariants}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, amount: 0.32 }}
        style={{
          x: reduceMotion ? 0 : textX,
          opacity: textOpacity,
          willChange: "transform, opacity",
        }}
        className={`flex h-full flex-col justify-center md:col-span-5 ${item.reverse ? "md:order-1" : ""}`}
      >
        <motion.div variants={textItemVariants}>
          <TypedText
            as="p"
            text={item.eyebrow}
            progress={scrollYProgress}
            start={0.08}
            end={0.22}
            className="text-sm font-semibold uppercase tracking-[0.16em] text-secondary md:text-base"
          />
        </motion.div>

        <motion.div variants={textItemVariants}>
          <TypedText
            as="h3"
            text={item.title}
            progress={scrollYProgress}
            start={0.16}
            end={0.48}
            className="mt-2 text-3xl font-display font-semibold leading-tight tracking-[0.015em] text-foreground md:text-5xl"
          />
        </motion.div>

        <motion.div variants={textItemVariants}>
          <TypedText
            as="p"
            text={item.description}
            progress={scrollYProgress}
            start={0.28}
            end={0.62}
            className="mt-4 max-w-[48ch] text-[18px] leading-relaxed tracking-[0.012em] text-muted-foreground md:text-[20px]"
          />
        </motion.div>

        <motion.div
          variants={textItemVariants}
          className={`mt-4 h-[2px] w-24 bg-gradient-to-r from-secondary/90 to-accent/75 ${item.reverse ? "md:ml-auto" : ""}`}
        />

        <motion.ul variants={textContainerVariants} className="mt-6 space-y-2.5">
          {item.highlights.map((point, index) => (
            <motion.li key={point} variants={textItemVariants} className="flex items-start gap-2.5 text-base text-foreground/90 md:text-[1.06rem]">
              <span className="mt-[0.42rem] h-1.5 w-1.5 shrink-0 rounded-full bg-secondary" aria-hidden="true" />
              <TypedText
                as="span"
                text={point}
                progress={scrollYProgress}
                start={0.5 + index * 0.08}
                end={0.72 + index * 0.1}
                className="leading-relaxed"
              />
            </motion.li>
          ))}
        </motion.ul>
      </motion.div>
    </motion.article>
  );
};

const VisualShowcase = () => {
  const reduceMotion = useReducedMotion();
  const introRef = useRef<HTMLDivElement | null>(null);
  const { scrollYProgress: introProgress } = useScroll({
    target: introRef,
    offset: ["start 0.88", "end 0.35"],
  });

  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-background via-muted/20 to-background py-20 md:py-28">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-[-8%] top-14 h-40 w-40 rounded-full bg-secondary/8 blur-3xl" />
        <div className="absolute bottom-[-4%] right-[-5%] h-44 w-44 rounded-full bg-accent/8 blur-3xl" />
      </div>

      <div className="relative container mx-auto px-6">
        <motion.div
          ref={introRef}
          initial={{ opacity: 0, y: reduceMotion ? 14 : 28, filter: reduceMotion ? "blur(0px)" : "blur(8px)" }}
          whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          transition={{ duration: reduceMotion ? 0.4 : 0.65, ease: "easeOut" }}
          viewport={{ once: true, amount: 0.2 }}
          className="mx-auto max-w-3xl text-center"
        >
          <TypedText
            as="p"
            text="Built for Freelancers"
            progress={introProgress}
            start={0.08}
            end={0.28}
            className="text-xs font-semibold uppercase tracking-[0.16em] text-secondary"
          />
          <TypedText
            as="h2"
            text="Get hired faster with work that speaks for itself"
            progress={introProgress}
            start={0.2}
            end={0.56}
            className="mt-3 text-3xl font-display font-bold tracking-[0.015em] text-foreground md:text-5xl"
          />
          <TypedText
            as="p"
            text="Show your strengths clearly, apply with confidence, and deliver professionally to grow repeat client opportunities."
            progress={introProgress}
            start={0.42}
            end={0.82}
            className="mt-4 text-[18px] leading-relaxed tracking-[0.012em] text-muted-foreground md:text-[20px]"
          />
        </motion.div>

        <div className="mt-14 space-y-16 md:mt-20 md:space-y-24">
          {showcaseItems.map((item) => (
            <ShowcaseRow key={item.id} item={item} />
          ))}
        </div>
      </div>
    </section>
  );
};

export default VisualShowcase;
