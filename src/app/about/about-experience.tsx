"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState, type ReactNode } from "react";
import {
  MotionConfig,
  motion,
  useScroll,
  useTransform,
  type MotionValue,
} from "framer-motion";

import { features, journey, reviews, tracks, values, type Track } from "./about-content";
import styles from "./about.module.css";

const ease = [0.22, 1, 0.36, 1] as const;

function Reveal({ children, delay = 0, y = 32, className }: { children: ReactNode; delay?: number; y?: number; className?: string }) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.25 }}
      transition={{ duration: 0.9, ease, delay }}
    >
      {children}
    </motion.div>
  );
}

function ArrowIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M7 17 17 7M8 7h9v9" />
    </svg>
  );
}

// Sticky stacking only makes sense when a whole card fits on screen (desktop).
function useIsDesktop() {
  const [isDesktop, setIsDesktop] = useState(false);
  useEffect(() => {
    const query = window.matchMedia("(min-width: 1024px)");
    const update = () => setIsDesktop(query.matches);
    update();
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);
  return isDesktop;
}

/* ───────────────────────────── Hero ───────────────────────────── */

function Hero() {

  return (
    <section className="mx-auto w-full max-w-[1280px] px-4 pt-8 sm:px-6 lg:pt-14" aria-labelledby="about-title">
      <div className="grid items-end gap-8 lg:grid-cols-[1.35fr_1fr] lg:gap-16">
        <h1 id="about-title" className="text-[clamp(40px,6.4vw,88px)] font-semibold uppercase leading-[0.95] tracking-[-0.045em] text-ink">
          {["A better way", "to keep learning."].map((line, index) => (
            <span key={line} className="block overflow-hidden pb-[0.06em]">
              <motion.span
                className={`block ${index === 1 ? "text-brand" : ""}`}
                initial={{ y: "105%" }}
                animate={{ y: 0 }}
                transition={{ duration: 1, ease, delay: 0.1 + index * 0.12 }}
              >
                {line}
              </motion.span>
            </span>
          ))}
        </h1>
        <motion.div
          className="max-w-md pb-2 lg:justify-self-end"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, ease, delay: 0.35 }}
        >
          <p className="text-base leading-relaxed text-slate-600 sm:text-lg">
            Curiosity does not follow a timetable. SI Tutor brings clear lessons, useful study files and your progress together in one place.
          </p>
          <Link href="/subjects" className="group mt-5 inline-flex items-center gap-2 text-sm font-semibold text-ink">
            <span className="border-b border-ink/30 pb-0.5 transition-colors group-hover:border-brand group-hover:text-brand">Explore subjects</span>
            <span className="grid h-7 w-7 place-items-center rounded-full bg-ink text-white transition-colors group-hover:bg-brand">
              <ArrowIcon className="h-3.5 w-3.5" />
            </span>
          </Link>
        </motion.div>
      </div>


    </section>
  );
}

/* ─────────────────────── Mission & values bento ─────────────────────── */

function ValueIcon({ name }: { name: (typeof values)[number]["icon"] }) {
  const common = { fill: "none", stroke: "#0F172A", strokeWidth: 1.8, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  return (
    <svg viewBox="0 0 32 32" className="h-8 w-8" aria-hidden="true">
      {name === "spark" && (
        <>
          <path {...common} d="M16 4v6M16 22v6M4 16h6M22 16h6" />
          <circle cx="16" cy="16" r="3.2" fill="#1D4ED8" />
          <path {...common} d="m8 8 3 3M21 21l3 3M24 8l-3 3M11 21l-3 3" opacity=".45" />
        </>
      )}
      {name === "stack" && (
        <>
          <path {...common} d="M16 5 4 11l12 6 12-6z" />
          <path {...common} d="m4 16 12 6 12-6" />
          <path {...common} d="m4 21 12 6 12-6" opacity=".45" />
          <circle cx="16" cy="11" r="2" fill="#1D4ED8" />
        </>
      )}
      {name === "prism" && (
        <>
          <path {...common} d="M16 4 5 26h22z" />
          <path {...common} d="M16 4v22" opacity=".45" />
          <circle cx="16" cy="19" r="2.4" fill="#1D4ED8" />
        </>
      )}
    </svg>
  );
}

function ValueCard({ value, delay }: { value: (typeof values)[number]; delay: number }) {
  return (
    <motion.article
      className="flex min-h-[220px] flex-col justify-between rounded-3xl p-6 transition-shadow hover:shadow-[0_20px_40px_-24px_rgba(15,23,42,0.35)] sm:aspect-square sm:min-h-0"
      style={{ background: value.tone }}
      initial={{ opacity: 0, y: 40, scale: 0.96 }}
      whileInView={{ opacity: 1, y: 0, scale: 1 }}
      viewport={{ once: true, amount: 0.3 }}
      transition={{ duration: 0.8, ease, delay }}
      whileHover={{ y: -6 }}
    >
      <ValueIcon name={value.icon} />
      <div>
        <h3 className="text-xl font-semibold tracking-[-0.03em] !text-[#0f172a] sm:text-2xl">
          {value.title}
        </h3>
        <p className="mt-2 text-sm leading-snug !text-[#475569]">
          {value.text}
        </p>
      </div>
    </motion.article>
  );
}

function Shape({ children, delay }: { children: ReactNode; delay: number }) {
  return (
    <motion.div
      className="hidden aspect-square lg:block"
      aria-hidden="true"
      initial={{ opacity: 0, scale: 0.9 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ once: true, amount: 0.3 }}
      transition={{ duration: 1, ease, delay }}
    >
      {children}
    </motion.div>
  );
}

function Mission() {
  const [sky, lavender, mint] = values;
  return (
    <section className="mx-auto w-full max-w-[1280px] px-4 py-24 sm:px-6 lg:py-32" aria-labelledby="mission-title">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Reveal className="sm:col-span-2 lg:pr-10 lg:pt-6">
          <p className="text-xs font-semibold tracking-[0.2em] text-brand">OUR MISSION</p>
          <h2 id="mission-title" className="mt-4 text-[clamp(34px,4.4vw,58px)] font-semibold leading-[1.04] tracking-[-0.04em] text-ink">
            Reimagining personalized learning with purpose
          </h2>
          <p className="mt-5 max-w-lg text-base leading-relaxed text-slate-600">
            SI Tutor combines adaptive AI, carefully structured courses and clear progress tracking so every learner can understand deeply, practise with confidence and keep moving forward.
          </p>
        </Reveal>

        <ValueCard value={sky} delay={0.05} />

        <Shape delay={0.15}>
          <svg viewBox="0 0 100 100" className="h-full w-full">
            <path d="M88 2c6 0 10 4 10 10v76c0 6-4 10-10 10H14C5 98 1 91 7 84L80 6c2-3 5-4 8-4z" fill="#123d58" />
          </svg>
        </Shape>

        <Shape delay={0.1}>
          <div className="grid h-full w-full grid-cols-2 gap-3">
            <span className="rounded-2xl bg-slate-100" />
            <span className="rounded-2xl rounded-tr-[100%] bg-slate-100" />
            <span className="rounded-2xl bg-slate-100" />
            <span className="rounded-2xl bg-slate-100" />
          </div>
        </Shape>

        <ValueCard value={lavender} delay={0.15} />

        <Shape delay={0.2}>
          <svg viewBox="0 0 100 100" className="h-full w-full">
            <path d="M0 24C0 6 22-2 34 16c10 15 14 34 24 34s14-26 26-34C94 8 100 16 100 26v62c0 6-4 10-10 10H10C4 98 0 94 0 88z" fill="#123d58" />
          </svg>
        </Shape>

        <ValueCard value={mint} delay={0.25} />
      </div>
    </section>
  );
}

/* ─────────────────────── Signature learning tracks ─────────────────────── */

function TrackCard({ track, index, total, progress, stacked }: { track: Track; index: number; total: number; progress: MotionValue<number>; stacked: boolean }) {
  const start = index / total;
  const scale = useTransform(progress, [start, 1], [1, 1 - (total - 1 - index) * 0.045]);

  return (
    <div
      className={stacked ? "sticky mb-[12vh] last:mb-0" : "mb-4 last:mb-0"}
      style={stacked ? { top: `calc(var(--site-header-clearance) + ${index * 22}px)` } : undefined}
    >
      <motion.article
        style={{ scale: stacked ? scale : 1, background: track.tone, transformOrigin: "50% 0%" }}
        className="relative grid overflow-hidden rounded-[32px] p-6 shadow-[0_-10px_40px_-30px_rgba(15,23,42,0.35)] sm:p-10 lg:min-h-[600px] lg:grid-cols-[1.1fr_1fr] lg:gap-10 lg:rounded-[40px] lg:p-12"
        aria-labelledby={`track-${track.slug}`}
      >
        <div className="flex flex-col">
          <h3
            id={`track-${track.slug}`}
            className="text-[clamp(38px,6.4vw,92px)] font-semibold leading-[0.9] tracking-[-0.05em] !text-[#0f172a]"
          >
            {track.title[0]}
            <br />
            {track.title[1]}
          </h3>
          <p className="mt-4 text-sm font-medium !text-[#475569]">
            {track.categories.join("  /  ")}
          </p>
          <div className="relative mt-6 h-[220px] w-full max-w-[420px] sm:h-[280px] lg:mt-auto lg:h-[320px]">
            <Image src={track.image} alt={track.imageAlt} fill sizes="(max-width: 1024px) 80vw, 420px" className="object-contain object-left-bottom mix-blend-multiply" />
          </div>
        </div>

        <div className="mt-8 flex flex-col justify-end lg:mt-0">
          <div className="mb-3 flex flex-wrap gap-2">
            <span className="rounded-full bg-white px-3 py-1.5 text-[11px] font-bold tracking-[0.08em] !text-[#0f172a]">
              SI TRACK 0{index + 1}
            </span>
            <span className="rounded-full bg-white/55 px-3 py-1.5 text-[11px] font-semibold !text-[#475569]">
              AI-powered
            </span>
          </div>
          <div className="rounded-3xl border border-[#28516b] bg-[#0b3049] p-5 shadow-[0_24px_50px_-30px_rgba(0,0,0,0.5)] sm:p-6">
            <p className="text-xl font-bold tracking-[-0.02em] text-ink sm:text-2xl">{track.product}</p>
            <p className="mt-1 text-sm text-slate-500">{track.focus}</p>
            <div className="mt-4 flex flex-wrap gap-2">
              {track.levels.map((level) => (
                <span key={level} className="rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-700">{level}</span>
              ))}
            </div>
            <div className="mt-5 grid gap-2.5 sm:grid-cols-[1.35fr_1fr]">
              <div className="rounded-2xl bg-brand p-4 text-white">
                <p className="text-xs font-medium text-blue-100">AI Features</p>
                <p className="mt-1 text-[15px] font-semibold leading-snug">{track.aiFeatures.join("  ·  ")}</p>
              </div>
              <div className="rounded-2xl bg-slate-100 p-4">
                <p className="text-xs font-medium text-slate-500">Estimated Mastery Time</p>
                <p className="mt-1 text-[15px] font-semibold text-ink">{track.mastery}</p>
              </div>
              <div className="flex items-center justify-between gap-3 rounded-2xl bg-slate-100 p-4 sm:col-span-2">
                <div>
                  <p className="text-xs font-medium text-slate-500">Availability</p>
                  <p className="mt-1 flex items-center gap-2 text-[15px] font-semibold text-ink">
                    <span className="h-2 w-2 rounded-full bg-emerald-500" aria-hidden="true" />
                    {track.availability}
                  </p>
                </div>
                <Link
                  href={`/subjects/${track.slug}`}
                  className="group inline-flex items-center gap-2 rounded-full bg-ink py-2 pl-4 pr-2 text-xs font-semibold text-white transition-colors hover:bg-brand"
                  aria-label={`Explore the ${track.title.join(" ")} track`}
                >
                  Explore track
                  <span className="grid h-6 w-6 place-items-center rounded-full bg-white/15"><ArrowIcon className="h-3 w-3" /></span>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </motion.article>
    </div>
  );
}

function Tracks() {
  const container = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: container, offset: ["start start", "end end"] });
  const stacked = useIsDesktop();

  return (
    <section className="mx-auto w-full max-w-[1280px] px-4 pb-24 sm:px-6" aria-labelledby="tracks-title">
      <Reveal>
        <h2 id="tracks-title" className="mx-auto max-w-2xl text-center text-[clamp(34px,4.4vw,58px)] font-semibold leading-[1.04] tracking-[-0.04em] text-ink">
          Our signature learning tracks
        </h2>
      </Reveal>
      <div ref={container} className="relative mt-14">
        {tracks.map((track, index) => (
          <TrackCard key={track.slug} track={track} index={index} total={tracks.length} progress={scrollYProgress} stacked={stacked} />
        ))}
      </div>
    </section>
  );
}

/* ─────────────────────── Why choose SI Tutor ─────────────────────── */

const dotPatterns: Record<string, string[]> = {
  bars: [
    "......x",
    "......x",
    "....x.x",
    "....x.x",
    "..x.x.x",
    "..x.x.x",
    "x.x.x.x",
  ],
  file: [
    "xxxxx..",
    "x...xx.",
    "x.....x",
    "x.xxx.x",
    "x.....x",
    "x.xxx.x",
    "xxxxxxx",
  ],
};

function DotIcon({ name }: { name: (typeof features)[number]["icon"] }) {
  const dots: { x: number; y: number; r: number; accent?: boolean }[] = [];
  if (name === "bars" || name === "file") {
    dotPatterns[name].forEach((row, y) =>
      [...row].forEach((cell, x) => {
        if (cell === "x") dots.push({ x: 4 + x * 6.67, y: 4 + y * 6.67, r: 1.7, accent: name === "bars" && x === 6 && y < 2 });
      }),
    );
  } else if (name === "clock") {
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * Math.PI * 2;
      dots.push({ x: 24 + Math.cos(a) * 18, y: 24 + Math.sin(a) * 18, r: 1.7 });
    }
    [0, 1, 2].forEach((s) => dots.push({ x: 24, y: 24 - s * 4.5, r: 1.7, accent: true }));
    [1, 2].forEach((s) => dots.push({ x: 24 + s * 4.2, y: 24, r: 1.7 }));
  } else {
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2;
      [7, 13, 19].forEach((d) => dots.push({ x: 24 + Math.cos(a) * d, y: 24 + Math.sin(a) * d, r: d === 19 ? 1.4 : 1.7 }));
    }
    dots.push({ x: 24, y: 24, r: 2.6, accent: true });
  }
  return (
    <svg viewBox="0 0 48 48" className="h-12 w-12" aria-hidden="true">
      {dots.map((dot, index) => (
        <circle key={index} cx={dot.x.toFixed(2)} cy={dot.y.toFixed(2)} r={dot.r} fill={dot.accent ? "#1D4ED8" : "#0F172A"} />
      ))}
    </svg>
  );
}

function WhyChoose() {
  return (
    <section className="mx-auto w-full max-w-[1280px] px-4 py-24 sm:px-6 lg:py-32" aria-labelledby="why-title">
      <Reveal>
        <h2 id="why-title" className="mx-auto max-w-xl text-center text-[clamp(34px,4.4vw,58px)] font-semibold leading-[1.04] tracking-[-0.04em] text-ink">
          Where curiosity meets intelligence
        </h2>
      </Reveal>
      <div className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-4 lg:items-start">
        {features.map((feature, index) => (
          <motion.article
            key={feature.title}
            className={`flex min-h-[300px] flex-col justify-between rounded-3xl p-6 lg:min-h-[360px] ${index % 2 ? "lg:mt-10" : ""}`}
            style={{ background: feature.tone }}
            initial={{ opacity: 0, y: 60 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.9, ease, delay: index * 0.1 }}
            whileHover={{ y: -8 }}
          >
            <DotIcon name={feature.icon} />
            <div>
              <h3 className="text-xl font-semibold tracking-[-0.03em] !text-[#0f172a]">
                {feature.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed !text-[#475569]">
                {feature.text}
              </p>
            </div>
          </motion.article>
        ))}
      </div>
    </section>
  );
}

/* ─────────────────────── Parallax banner ─────────────────────── */

const topSteps = [3, 2, 2, 1, 0, 1, 0, 0, 1, 0, 0, 1, 2, 1, 2, 3];
const bottomSteps = [1, 0, 0, 1, 2, 1, 0, 0, 2, 3, 2, 1, 0, 1, 2, 2];

function StepBlock({ level, progress, edge }: { level: number; progress: MotionValue<number>; edge: "top" | "bottom" }) {
  const unit = 34;
  const height = useTransform(
    progress,
    edge === "top" ? [0.05, 0.42] : [0.58, 0.95],
    edge === "top" ? [(level + 1) * unit, 0] : [0, (level + 1) * unit],
  );
  return <motion.span className="block flex-1 bg-white" style={{ height }} />;
}

function PotentialBanner() {
  const section = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: section, offset: ["start end", "end start"] });
  const imageY = useTransform(scrollYProgress, [0, 1], ["-12%", "12%"]);
  const textY = useTransform(scrollYProgress, [0.2, 0.8], [60, -60]);

  return (
    <section ref={section} className="relative isolate h-[clamp(540px,88vh,820px)] overflow-hidden" aria-labelledby="potential-title">
      <motion.div className="absolute inset-[-14%_0] -z-10" style={{ y: imageY }}>
        <Image
          src="/catalog/hsc-classroom-background.png"
          alt=""
          fill
          sizes="100vw"
          className="object-cover object-right"
        />
      </motion.div>
      <div className="absolute inset-0 -z-10 bg-[linear-gradient(180deg,rgba(15,23,42,0.45),rgba(29,78,216,0.62)_55%,rgba(15,23,42,0.78))]" />

      <div className="absolute inset-x-0 top-0 flex items-start" aria-hidden="true">
        {topSteps.map((level, index) => <StepBlock key={index} level={level} progress={scrollYProgress} edge="top" />)}
      </div>
      <div className="absolute inset-x-0 bottom-0 flex items-end" aria-hidden="true">
        {bottomSteps.map((level, index) => <StepBlock key={index} level={level} progress={scrollYProgress} edge="bottom" />)}
      </div>

      <motion.div style={{ y: textY }} className="mx-auto flex h-full max-w-[1100px] flex-col items-center justify-center px-6 text-center">
        <h2 id="potential-title" className="text-[clamp(40px,7.4vw,108px)] font-semibold uppercase leading-[0.92] tracking-[-0.045em] text-white">
          Unlock your full
          <br />
          learning potential
        </h2>
        <div className="mt-9 flex flex-wrap justify-center gap-3">
          <Link href="/signup" className="rounded-full bg-white px-6 py-3 text-sm font-semibold text-ink transition hover:bg-blue-50">
            Try Free Demo
          </Link>
          <Link href="/subjects" className="rounded-full border border-white/60 bg-white/10 px-6 py-3 text-sm font-semibold text-white backdrop-blur-md transition hover:bg-white/20">
            Explore Subjects
          </Link>
        </div>
      </motion.div>
    </section>
  );
}

/* ─────────────────────── Journey accordion ─────────────────────── */

function Journey() {
  const [active, setActive] = useState(0);

  return (
    <section className="mx-auto w-full max-w-[1280px] px-4 py-24 sm:px-6 lg:py-32" aria-labelledby="journey-title">
      <Reveal>
        <h2 id="journey-title" className="mx-auto max-w-xl text-center text-[clamp(34px,4.4vw,58px)] font-semibold leading-[1.04] tracking-[-0.04em] text-ink">
          The journey of smart learning
        </h2>
      </Reveal>

      <Reveal delay={0.1} className="mt-14">
        <div className="flex flex-col gap-3 md:h-[560px] md:flex-row">
          {journey.map((step, index) => {
            const isActive = index === active;
            return (
              <motion.div
                key={step.title}
                layout
                transition={{ layout: { duration: 0.75, ease } }}
                className={`relative overflow-hidden rounded-3xl bg-mist ${isActive ? "md:flex-1" : "md:w-[84px] md:flex-none"}`}
              >
                {isActive ? (
                  <motion.div
                    key="open"
                    className="flex h-full flex-col items-center p-6 text-center sm:p-10"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.5, delay: 0.25 }}
                  >
                    <p className="text-xs font-semibold tracking-[0.2em] text-brand">STEP 0{index + 1}</p>
                    <h3 className="mt-3 text-2xl font-semibold tracking-[-0.03em] text-ink sm:text-3xl">
                      0{index + 1}. {step.title}
                    </h3>
                    <p className="mt-3 max-w-lg text-sm leading-relaxed text-slate-600 sm:text-base">{step.text}</p>
                    <div className="relative mt-6 h-[240px] w-full max-w-[460px] flex-1 md:h-auto">
                    <Image
                      src={step.image}
                      alt={step.imageAlt}
                      fill
                      sizes="(max-width: 768px) 90vw, 460px"
                      className="object-contain"
                    />
                    </div>
                  </motion.div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setActive(index)}
                    className="group flex h-full w-full items-center justify-between gap-3 px-6 py-5 text-left transition-colors hover:bg-slate-100 md:flex-col md:justify-center md:px-0"
                    aria-label={`Open step 0${index + 1}: ${step.title}`}
                  >
                    <span className="text-sm font-semibold text-ink md:hidden">0{index + 1}. {step.title}</span>
                    <span className={`${styles.verticalOpen} text-xs font-semibold text-slate-500 group-hover:text-brand`} aria-hidden="true">
                      {"OPEN".split("").map((letter) => <span key={letter}>{letter}</span>)}
                    </span>
                  </button>
                )}
              </motion.div>
            );
          })}
        </div>
      </Reveal>
    </section>
  );
}

/* ─────────────────────── Testimonials marquee ─────────────────────── */

function ReviewRow({ reverse = false }: { reverse?: boolean }) {
  const list = reverse ? [...reviews].reverse() : [...reviews];
  return (
    <div className={styles.marquee}>
      <div className={`${styles.marqueeTrack} ${reverse ? styles.marqueeReverse : ""}`}>
        {[0, 1].map((copy) => (
          <div key={copy} className="flex shrink-0 gap-4 pr-4" aria-hidden={copy === 1 || undefined}>
            {list.map((review) => (
              <article key={review.name} className="flex w-[300px] shrink-0 flex-col justify-between rounded-3xl bg-mist p-6 sm:w-[340px]">
                <div>
                  <p className="text-base tracking-[0.12em] text-brand" aria-label="5 out of 5 stars">★★★★★</p>
                  <p className="mt-3 text-sm leading-relaxed text-slate-700">“{review.quote}”</p>
                </div>
                <div className="mt-6 flex items-center gap-3">
                  <Image src={`/account-avatars/${review.avatar}.png`} alt="" width={40} height={40} className="h-10 w-10 rounded-xl object-cover" />
                  <div>
                    <p className="text-sm font-semibold text-ink">{review.name}</p>
                    <p className="text-xs text-slate-500">{review.track}</p>
                  </div>
                </div>
              </article>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

function Testimonials() {
  return (
    <section className="py-24 lg:py-28" aria-labelledby="reviews-title">
      <Reveal className="px-4">
        <h2 id="reviews-title" className="mx-auto max-w-2xl text-center text-[clamp(34px,4.4vw,58px)] font-semibold leading-[1.04] tracking-[-0.04em] text-ink">
          Trusted by students and lifelong learners
        </h2>
        <p className="mt-4 text-center text-xs text-slate-400">Sample reviews for design preview. Real learner reviews will appear here after launch.</p>
      </Reveal>
      <div className="mt-12 grid gap-4">
        <ReviewRow />
        <ReviewRow reverse />
      </div>
    </section>
  );
}

/* ─────────────────────────── Page ─────────────────────────── */

export function AboutExperience() {
  return (
    <MotionConfig reducedMotion="user">
      <main
        id="main-content"
        tabIndex={-1}
        className={`${styles.aboutPage} overflow-x-clip`}
      >
          <Hero />
          <Mission />
          <Tracks />
          <WhyChoose />
          <PotentialBanner />
          <Journey />
          <Testimonials />
      </main>
    </MotionConfig>
  );
}
