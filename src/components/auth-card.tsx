"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { AnimatePresence, LayoutGroup, MotionConfig, motion } from "framer-motion";
import { AuthCharacters } from "./auth-characters";
import styles from "./auth.module.css";
import headerStyles from "./site-header.module.css";

const ease = [0.22, 1, 0.36, 1] as const;
const swap = { type: "spring", stiffness: 140, damping: 22, mass: 0.9 } as const;

const visualCopy = {
  signup: {
    chip: "Your AI tutor is ready",
    title: "Learn smarter, every day",
    text: "Adaptive lessons, study files and progress in one place.",
  },
  login: {
    chip: "We won’t peek. Promise.",
    title: "Your learning, all in one place",
    text: "Lessons, notes and progress waiting for you.",
  },
} as const;

/** Persistent layout for /login and /signup. Login: image left, form right. Sign up: form left, image right. */
export function AuthShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const mode = pathname.startsWith("/signup") ? "signup" : "login";
  const imageFirst = mode === "login";
  const copy = visualCopy[mode];

  return (
    <MotionConfig reducedMotion="user">
      <main id="main-content" tabIndex={-1} className={styles.page} data-mode={mode}>
        {/* Sky background: soft clouds, slow drifting layers and faint orbit lines */}
        <div className={styles.sky} aria-hidden="true">
          <span className={styles.orbit} />
          <span className={`${styles.orbit} ${styles.orbitWide}`} />
          <span className={styles.drift} />
          <span className={`${styles.drift} ${styles.driftSlow}`} />
        </div>

        <motion.div
          className={styles.card}
          data-image-first={imageFirst || undefined}
          initial={{ opacity: 0, y: 36, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.8, ease }}
        >
          <LayoutGroup>
            <motion.section layout="position" transition={swap} className={styles.formSide} style={{ order: imageFirst ? 2 : 1 }}>
              <motion.div
                key={mode}
                className={styles.formSlot}
                initial={{ opacity: 0, x: imageFirst ? 40 : -40 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, ease, delay: 0.12 }}
              >
                {children}
              </motion.div>
            </motion.section>

            <motion.aside
              layout="position"
              transition={swap}
              className={styles.visual}
              data-notch={imageFirst ? "right" : "left"}
              style={{ order: imageFirst ? 1 : 2 }}
            >
              <Link href="/" className={styles.backNotch} aria-label="Back to home">
                <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M19 12H5m6-6-6 6 6 6" /></svg>
              </Link>
              <div className={styles.photo} aria-hidden="true">
                {/* Login: animated characters. Sign up: study-desk photo. Cross-fades on switch. */}
                <AnimatePresence initial={false}>
                  {imageFirst ? (
                    <motion.div
                      key="characters"
                      className={styles.photoInner}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.5 }}
                    >
                      <AuthCharacters />
                    </motion.div>
                  ) : (
                    <motion.div
                      key="photo"
                      className={styles.photoInner}
                      initial={{ opacity: 0, scale: 1.12 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 1.2, ease }}
                    >
                      <Image src="/auth/signup-study-desk.jpg" alt="" fill priority sizes="(max-width: 1024px) 0px, 520px" className={styles.photoImage} />
                    </motion.div>
                  )}
                </AnimatePresence>

                <AnimatePresence mode="wait" initial={false}>
                  <motion.div
                    key={`chip-${mode}`}
                    className={styles.chip}
                    initial={{ opacity: 0, y: -12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.45, ease, delay: 0.35 }}
                  >
                    <span className={styles.chipDot} />
                    {copy.chip}
                  </motion.div>
                </AnimatePresence>

                <AnimatePresence mode="wait" initial={false}>
                  {!imageFirst && <motion.div
                    key={`card-${mode}`}
                    className={styles.glassCard}
                    initial={{ opacity: 0, y: 24 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 12 }}
                    transition={{ duration: 0.55, ease, delay: 0.3 }}
                  >
                    <span className={styles.glassIcon}>
                      <svg viewBox="0 0 24 24"><path d="M12 3v3m0 12v3M3 12h3m12 0h3M6.3 6.3l2.1 2.1m7.2 7.2 2.1 2.1m0-11.4-2.1 2.1m-7.2 7.2-2.1 2.1" /><circle cx="12" cy="12" r="3" /></svg>
                    </span>
                    <span>
                      <strong>{copy.title}</strong>
                      <small>{copy.text}</small>
                    </span>
                    <span className={styles.bars}><i /><i /><i /><i /><i /></span>
                  </motion.div>}
                </AnimatePresence>
              </div>
            </motion.aside>
          </LayoutGroup>
        </motion.div>

        <footer className={styles.footer}>
          <span>© 2026 SI Tutor</span>
          <span>Learn at your pace. Grow beyond limits.</span>
        </footer>
      </main>
    </MotionConfig>
  );
}
