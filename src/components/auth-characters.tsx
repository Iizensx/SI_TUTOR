"use client";

import { useEffect, useRef, useState, type RefObject } from "react";
import { motion } from "framer-motion";
import styles from "./auth.module.css";

/*
  Playful login characters. Their eyes follow the pointer; they react to the form:
  - email field: everyone looks at the form
  - hidden password: they politely look away, while the tall blue one sneaks a peek
  - visible password: everyone shuts their eyes
  - wrong details: frowns and a head shake; success: a happy hop
  The form announces errors/success with a "si-auth" window event (see auth-form.tsx).
*/

type Mood = "idle" | "email" | "password" | "reveal";
type Reaction = "none" | "error" | "success";
type Point = { x: number; y: number };

const VIEW = { x: 8, w: 364, h: 330 };
const spring = { type: "spring", stiffness: 160, damping: 16 } as const;

function useAuthMood() {
  const [mood, setMood] = useState<Mood>("idle");
  const [reaction, setReaction] = useState<Reaction>("none");
  const [typing, setTyping] = useState(0);

  useEffect(() => {
    const read = () => {
      const active = document.activeElement as HTMLElement | null;
      const password = document.getElementById("password") as HTMLInputElement | null;
      if (active?.id === "email") return setMood("email");
      const inPasswordField = !!password && !!active && active.parentElement === password.parentElement;
      if (active?.id === "password" || inPasswordField) {
        return setMood(password?.type === "text" ? "reveal" : "password");
      }
      setMood("idle");
    };
    const onFocus = () => requestAnimationFrame(read);
    const onClick = () => requestAnimationFrame(read);
    const onInput = (event: Event) => {
      const id = (event.target as HTMLElement | null)?.id;
      if (id === "email" || id === "password") setTyping((count) => count + 1);
    };
    let timer = 0;
    const onAuth = (event: Event) => {
      const detail = (event as CustomEvent<Reaction>).detail;
      setReaction(detail);
      window.clearTimeout(timer);
      timer = window.setTimeout(() => setReaction("none"), detail === "error" ? 1800 : 1400);
    };
    document.addEventListener("focusin", onFocus);
    document.addEventListener("focusout", onFocus);
    document.addEventListener("click", onClick);
    document.addEventListener("input", onInput);
    window.addEventListener("si-auth", onAuth);
    return () => {
      document.removeEventListener("focusin", onFocus);
      document.removeEventListener("focusout", onFocus);
      document.removeEventListener("click", onClick);
      document.removeEventListener("input", onInput);
      window.removeEventListener("si-auth", onAuth);
      window.clearTimeout(timer);
    };
  }, []);

  return { mood, reaction, typing };
}

/** Pointer position converted into the SVG's own coordinate space. */
function usePointer(svgRef: RefObject<SVGSVGElement | null>) {
  const [pointer, setPointer] = useState<Point | null>(null);
  useEffect(() => {
    let frame = 0;
    const onMove = (event: PointerEvent) => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const rect = svgRef.current?.getBoundingClientRect();
        if (!rect || !rect.width) return;
        setPointer({
          x: VIEW.x + ((event.clientX - rect.left) / rect.width) * VIEW.w,
          y: ((event.clientY - rect.top) / rect.height) * VIEW.h,
        });
      });
    };
    window.addEventListener("pointermove", onMove);
    return () => {
      window.removeEventListener("pointermove", onMove);
      cancelAnimationFrame(frame);
    };
  }, [svgRef]);
  return pointer;
}

function useBlink() {
  const [blink, setBlink] = useState(false);
  useEffect(() => {
    let timer = 0;
    const schedule = () => {
      timer = window.setTimeout(() => {
        setBlink(true);
        window.setTimeout(() => setBlink(false), 140);
        schedule();
      }, 2600 + Math.random() * 2600);
    };
    schedule();
    return () => window.clearTimeout(timer);
  }, []);
  return blink;
}

/** Converts the pointer into a pupil offset for an eye at (cx, cy) in SVG units. */
function look(pointer: Point | null, cx: number, cy: number, max: number, override: Point | null): Point {
  if (override) return { x: override.x * max, y: override.y * max };
  if (!pointer) return { x: 0, y: 0 };
  const dx = pointer.x - cx;
  const dy = pointer.y - cy;
  const distance = Math.hypot(dx, dy) || 1;
  const reach = Math.min(1, distance / 120);
  return { x: (dx / distance) * max * reach, y: (dy / distance) * max * reach };
}

function Eye({ cx, cy, r, pupil, white, offset, closed, sad, lidColor = "#0f172a" }: {
  cx: number; cy: number; r: number; pupil: number; white: boolean; offset: Point; closed: boolean; sad?: boolean; lidColor?: string;
}) {
  if (closed) {
    return <path d={`M${cx - r} ${cy} Q${cx} ${cy + r * 0.9} ${cx + r} ${cy}`} fill="none" stroke={lidColor} strokeWidth={2.4} strokeLinecap="round" />;
  }
  return (
    <g>
      {white && <circle cx={cx} cy={cy} r={r} fill="#fff" />}
      <motion.circle cx={cx} cy={cy} r={pupil} fill="#0f172a" animate={{ x: offset.x, y: offset.y }} transition={spring} />
      {sad && <path d={`M${cx - r} ${cy - r - 3} L${cx + r * 0.6} ${cy - r - 6}`} stroke="#0f172a" strokeWidth={2} strokeLinecap="round" />}
    </g>
  );
}

function Mouth({ x, y, w, mood, light = false }: { x: number; y: number; w: number; mood: "smile" | "flat" | "frown" | "open"; light?: boolean }) {
  const color = light ? "#fff" : "#0f172a";
  const d = mood === "smile"
    ? `M${x - w} ${y} Q${x} ${y + w * 0.8} ${x + w} ${y}`
    : mood === "frown"
      ? `M${x - w} ${y + 3} Q${x} ${y - w * 0.6} ${x + w} ${y + 3}`
      : `M${x - w} ${y} L${x + w} ${y}`;
  if (mood === "open") return <ellipse cx={x} cy={y + 2} rx={w * 0.55} ry={w * 0.45} fill={color} />;
  return <path d={d} fill="none" stroke={color} strokeWidth={2.4} strokeLinecap="round" />;
}

export function AuthCharacters() {
  const svgRef = useRef<SVGSVGElement>(null);
  const pointer = usePointer(svgRef);
  const blink = useBlink();
  const { mood, reaction, typing } = useAuthMood();

  const towardForm: Point = { x: 1, y: 0.25 };
  const away: Point = { x: -1, y: -0.45 };
  const error = reaction === "error";
  const success = reaction === "success";
  const shut = mood === "reveal" || blink;

  // Where each character is looking: forced direction for form states, otherwise the pointer.
  const gaze = (peek = false): Point | null =>
    error ? { x: 0, y: 0.6 } : mood === "email" ? towardForm : mood === "password" ? (peek ? towardForm : away) : null;

  const blueLean = error ? -6 : mood === "password" ? 14 : mood === "email" ? 5 : mood === "reveal" ? -4 : 0;
  const navyLean = error ? -3 : mood === "email" ? 4 : mood === "password" ? -5 : 0;
  const mouthMood = error ? "frown" : success ? "open" : mood === "reveal" ? "flat" : "smile";
  const shake = error ? { x: [0, -7, 7, -5, 5, 0] } : { x: 0 };
  const hop = success ? { y: [0, -18, 0] } : { y: 0 };

  return (
    <div className={styles.characters} aria-hidden="true">
      <svg ref={svgRef} viewBox={`${VIEW.x} 0 ${VIEW.w} ${VIEW.h}`} className={styles.charactersSvg}>
        {/* Blue — tall and curious */}
        <motion.g style={{ originX: 0.5, originY: 1 }} animate={{ rotate: blueLean, ...hop }} transition={success ? { duration: 0.6 } : spring}>
          <motion.g animate={shake} transition={{ duration: 0.6 }}>
            <rect x="118" y="40" width="124" height="300" rx="10" fill="#1d4ed8" />
            {(() => {
              const o = look(pointer, 175, 80, 3.5, gaze(true));
              return (
                <>
                  <Eye cx={165} cy={80} r={7} pupil={3.6} white offset={o} closed={shut} sad={error} />
                  <Eye cx={192} cy={80} r={7} pupil={3.6} white offset={o} closed={shut} sad={error} />
                </>
              );
            })()}
            <Mouth x={178} y={104} w={7} mood={mouthMood} light />
          </motion.g>
        </motion.g>

        {/* Navy — calm and shy */}
        <motion.g style={{ originX: 0.5, originY: 1 }} animate={{ rotate: navyLean, ...hop }} transition={success ? { duration: 0.6, delay: 0.08 } : spring}>
          <motion.g animate={shake} transition={{ duration: 0.6, delay: 0.05 }}>
            <rect x="212" y="148" width="92" height="190" rx="8" fill="#0f172a" />
            {(() => {
              const o = look(pointer, 254, 180, 4, gaze());
              return (
                <>
                  <Eye cx={240} cy={180} r={9} pupil={4.4} white offset={o} closed={shut} lidColor="#fff" />
                  <Eye cx={268} cy={180} r={9} pupil={4.4} white offset={o} closed={shut} lidColor="#fff" />
                </>
              );
            })()}
          </motion.g>
        </motion.g>

        {/* Coral — round and cheerful */}
        <motion.g animate={{ ...hop }} transition={success ? { duration: 0.6, delay: 0.14 } : spring}>
          <motion.g animate={shake} transition={{ duration: 0.6, delay: 0.1 }}>
            <path d="M14 330 A116 116 0 0 1 246 330 Z" fill="#fb923c" />
            {(() => {
              const o = look(pointer, 128, 268, 5, gaze());
              const closed = shut || mood === "password";
              return (
                <>
                  <Eye cx={108} cy={268} r={6} pupil={4.6} white={false} offset={o} closed={closed} />
                  <Eye cx={148} cy={268} r={6} pupil={4.6} white={false} offset={o} closed={closed} />
                </>
              );
            })()}
            <Mouth x={128} y={292} w={11} mood={mouthMood} />
          </motion.g>
        </motion.g>

        {/* Mint — small and excitable: hops a little on every keystroke */}
        <motion.g
          key={typing}
          initial={{ y: typing ? -6 : 0 }}
          animate={{ y: success ? [0, -22, 0] : 0 }}
          transition={success ? { duration: 0.6, delay: 0.2 } : { type: "spring", stiffness: 500, damping: 12 }}
        >
          <motion.g animate={shake} transition={{ duration: 0.6, delay: 0.15 }}>
            <path d="M282 330 V250 a42 42 0 0 1 84 0 V330 Z" fill="#5eead4" />
            {(() => {
              const o = look(pointer, 322, 250, 4, gaze());
              return (
                <>
                  <Eye cx={310} cy={250} r={5} pupil={4} white={false} offset={o} closed={shut} />
                  <Eye cx={336} cy={250} r={5} pupil={4} white={false} offset={o} closed={shut} />
                </>
              );
            })()}
            <Mouth x={324} y={272} w={9} mood={mouthMood === "smile" ? "flat" : mouthMood} />
          </motion.g>
        </motion.g>
      </svg>
    </div>
  );
}
