"use client";

import { useEffect, useRef, useState } from "react";
import { animate, motion, useMotionValue } from "framer-motion";

/*
  SI Tutor logo loader.
  1. assemble  – the faceted "S" flies together from scattered shards
  2. loop      – the S spins on its vertical axis while the facets breathe apart
  3. settle    – when `done` turns true it stops facing front and the spark flashes
  4. lockup    – the S shrinks and slides left; "Si tutor" and the tagline rise in
  Then `onComplete` runs. Facet geometry is a hand-drawn vector of the SI mark (1024 × 1024).
*/

type Piece = { fill: string; points: string };
type Phase = "assemble" | "loop" | "settle" | "lockup";

const PIECES: Piece[] = [
  { fill: "#f0f0ee", points: "250,300 512,150 440,292" },
  { fill: "#b9b9b7", points: "250,300 440,292 355,360" },
  { fill: "#1b1b1c", points: "512,150 512,265 440,292" },
  { fill: "#5a5a5a", points: "440,292 512,265 355,360" },
  { fill: "#fafaf8", points: "512,150 775,300 612,300" },
  { fill: "#2b2b2c", points: "512,150 612,300 512,265" },
  { fill: "#c8c8c6", points: "612,300 775,300 690,415" },
  { fill: "#3d3d3e", points: "512,265 612,300 690,415 600,382" },
  { fill: "#d6d6d4", points: "250,300 355,360 250,510" },
  { fill: "#7a7a7a", points: "355,360 430,510 250,510" },
  { fill: "#262627", points: "355,360 512,440 430,510" },
  { fill: "#e9e9e7", points: "774,736 512,886 584,744" },
  { fill: "#9d9d9b", points: "774,736 584,744 669,676" },
  { fill: "#141415", points: "512,886 512,771 584,744" },
  { fill: "#4a4a4a", points: "584,744 512,771 669,676" },
  { fill: "#f4f4f2", points: "512,886 249,736 412,736" },
  { fill: "#1f1f20", points: "512,886 412,736 512,771" },
  { fill: "#d8d8d6", points: "412,736 249,736 334,621" },
  { fill: "#6b6b6c", points: "512,771 412,736 334,621 424,654" },
  { fill: "#c4c4c2", points: "774,736 669,676 774,526" },
  { fill: "#8f8f8f", points: "669,676 594,526 774,526" },
  { fill: "#3a3a3b", points: "669,676 512,596 594,526" },
];
const CENTER = "430,510 512,440 594,526 512,596";

const C = { x: 512, y: 518 };
const SPIN = 1.9; // seconds per turn
const ease = [0.22, 1, 0.36, 1] as const;

// Each facet's centre, used to push it outwards from the middle of the S.
const centres = PIECES.map(({ points }) => {
  const pts = points.split(" ").map((pair) => pair.split(",").map(Number));
  const x = pts.reduce((sum, p) => sum + p[0], 0) / pts.length;
  const y = pts.reduce((sum, p) => sum + p[1], 0) / pts.length;
  return { dx: x - C.x, dy: y - C.y };
});

// Deterministic "random" scatter so server and client render the same first frame.
const scatter = centres.map(({ dx, dy }, index) => {
  const angle = ((index * 137.5) % 360) * (Math.PI / 180);
  return { x: dx * 1.6 + Math.cos(angle) * 160, y: dy * 1.6 + Math.sin(angle) * 160, rotate: ((index * 67) % 140) - 70 };
});

function Mark({ phase }: { phase: Phase }) {
  return (
    <svg viewBox="200 120 624 800" className="h-full w-full overflow-visible" aria-hidden="true">
      <defs>
        <radialGradient id="si-spark" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#fff" stopOpacity="0.95" />
          <stop offset="100%" stopColor="#fff" stopOpacity="0" />
        </radialGradient>
      </defs>
      {PIECES.map((piece, index) => {
        const { dx, dy } = centres[index];
        const s = scatter[index];
        return (
          <motion.polygon
            key={index}
            points={piece.points}
            fill={piece.fill}
            stroke={piece.fill}
            strokeWidth={1.5}
            strokeLinejoin="round"
            style={{ transformBox: "fill-box", transformOrigin: "center" }}
            initial={{ x: s.x, y: s.y, rotate: s.rotate, opacity: 0, scale: 0.6 }}
            animate={
              phase === "assemble"
                ? { x: 0, y: 0, rotate: 0, opacity: 1, scale: 1, transition: { type: "spring", stiffness: 120, damping: 15, delay: 0.04 * index } }
                : phase === "loop"
                  ? { x: [0, dx * 0.16, 0], y: [0, dy * 0.16, 0], rotate: 0, opacity: 1, scale: 1, transition: { duration: SPIN, ease: "easeInOut", repeat: Infinity } }
                  : { x: 0, y: 0, rotate: 0, opacity: 1, scale: 1, transition: { duration: 0.5, ease } }
            }
          />
        );
      })}
      <polygon points={CENTER} fill="#0b0b0c" />
      <motion.rect
        x={490} y={482} width={44} height={168} rx={4} fill="#f5f5f3"
        initial={{ scaleY: 0, opacity: 0 }}
        animate={{ scaleY: 1, opacity: 1 }}
        transition={{ delay: 0.9, duration: 0.5, ease }}
        style={{ transformBox: "fill-box", transformOrigin: "bottom" }}
      />
      <motion.g
        style={{ transformBox: "fill-box", transformOrigin: "center" }}
        initial={{ scale: 0, opacity: 0 }}
        animate={phase === "settle" || phase === "lockup" ? { scale: [0, 1.6, 1], opacity: 1, rotate: [0, 90, 90] } : { scale: 0.8, opacity: 0.9 }}
        transition={{ duration: 0.7, ease }}
      >
        <circle cx={512} cy={428} r={56} fill="url(#si-spark)" />
        <path d="M512 388 C516 414 522 420 548 424 C522 428 516 434 512 460 C508 434 502 428 476 424 C502 420 508 414 512 388Z" fill="#fff" />
      </motion.g>
    </svg>
  );
}

const WORD = "Si tutor";
const TAGLINE = "SUPER INTELLIGENCE TUTOR";

export function SiLoader({ done, onComplete, label = "Signing you in" }: { done: boolean; onComplete?: () => void; label?: string }) {
  const [phase, setPhase] = useState<Phase>("assemble");
  const rotateY = useMotionValue(0);
  const loopStart = useRef(0);
  const finished = useRef(false);

  // assemble → loop
  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const timer = setTimeout(() => {
      loopStart.current = performance.now();
      setPhase(reduce ? "settle" : "loop");
    }, reduce ? 50 : 1300);
    return () => clearTimeout(timer);
  }, []);

  // Spin while looping
  useEffect(() => {
    if (phase !== "loop") return;
    const from = rotateY.get();
    const controls = animate(rotateY, [from, from + 360], { duration: SPIN, ease: "easeInOut", repeat: Infinity, repeatDelay: 0.15 });
    return () => controls.stop();
  }, [phase, rotateY]);

  // Latest callback without restarting the sequence when the parent re-renders.
  const onCompleteRef = useRef(onComplete);
  useEffect(() => { onCompleteRef.current = onComplete; }, [onComplete]);

  // Timers live for the whole sequence and are cleared only on unmount.
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  // done → settle (after at least one full turn) → lockup → onComplete
  useEffect(() => {
    if (!done || finished.current || phase === "assemble") return;
    finished.current = true;
    const wait = phase === "loop" ? Math.max(0, SPIN * 1000 - (performance.now() - loopStart.current)) : 0;
    timers.current.push(setTimeout(() => {
      const current = rotateY.get();
      animate(rotateY, Math.ceil(current / 360) * 360, { duration: 0.6, ease: [0.22, 1, 0.36, 1] });
      setPhase("settle");
      timers.current.push(setTimeout(() => setPhase("lockup"), 750));
      timers.current.push(setTimeout(() => onCompleteRef.current?.(), 750 + 1700));
    }, wait));
  }, [done, phase, rotateY]);

  const lockup = phase === "lockup";

  return (
    <motion.div
      className="fixed inset-0 z-[200] grid place-items-center overflow-hidden bg-black text-white"
      role="status"
      aria-live="polite"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, transition: { duration: 0.35 } }}
    >
      <span className="sr-only">{lockup ? "SI Tutor" : `${label}…`}</span>
      <motion.span
        aria-hidden="true"
        className="pointer-events-none absolute h-[60vmin] w-[60vmin] rounded-full bg-white/[0.06] blur-3xl"
        animate={{ scale: lockup ? 1.4 : [1, 1.15, 1], opacity: lockup ? 0.5 : 1 }}
        transition={lockup ? { duration: 1 } : { duration: 3, repeat: Infinity }}
      />
      <motion.div layout className="relative flex items-center gap-[clamp(16px,3vw,40px)] px-6" transition={{ layout: { duration: 0.9, ease } }}>
        <motion.div
          layout
          className="h-[clamp(150px,30vmin,280px)] w-[clamp(118px,23.4vmin,218px)] flex-none"
          style={{ perspective: 900 }}
          animate={{ scale: lockup ? 0.8 : 1 }}
          transition={{ duration: 0.9, ease }}
        >
          <motion.div className="h-full w-full" style={{ rotateY, transformStyle: "preserve-3d" }}>
            <Mark phase={phase} />
          </motion.div>
        </motion.div>
        {lockup && (
          <motion.div layout className="overflow-hidden" initial={{ width: 0 }} animate={{ width: "auto" }} transition={{ duration: 0.9, ease }}>
            <div className="whitespace-nowrap pr-2">
              <p className="text-[clamp(44px,8vmin,92px)] font-bold leading-none tracking-[-0.03em]" aria-hidden="true">
                {WORD.split("").map((char, index) => (
                  <motion.span
                    key={index}
                    className="inline-block"
                    initial={{ y: "70%", opacity: 0, filter: "blur(6px)" }}
                    animate={{ y: 0, opacity: 1, filter: "blur(0px)" }}
                    transition={{ delay: 0.35 + index * 0.06, duration: 0.6, ease }}
                  >
                    {char === " " ? "\u00a0" : char}
                  </motion.span>
                ))}
              </p>
              <motion.p
                className="mt-[1.4vmin] text-[clamp(11px,1.9vmin,20px)] font-semibold text-white/70"
                aria-hidden="true"
                initial={{ opacity: 0, letterSpacing: "0.6em" }}
                animate={{ opacity: 1, letterSpacing: "0.08em" }}
                transition={{ delay: 0.85, duration: 0.9, ease }}
              >
                {TAGLINE}
              </motion.p>
            </div>
          </motion.div>
        )}
      </motion.div>
      <motion.p
        className="absolute bottom-[8vh] text-xs tracking-[0.3em] text-white/45"
        aria-hidden="true"
        animate={{ opacity: lockup ? 0 : [0.35, 0.8, 0.35] }}
        transition={lockup ? { duration: 0.3 } : { duration: 1.6, repeat: Infinity }}
      >
        {label.toUpperCase()}
      </motion.p>
    </motion.div>
  );
}
