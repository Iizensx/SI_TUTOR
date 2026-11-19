"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

import type { UserProfile } from "@/lib/auth-types";
import { AccountAvatar } from "./account-avatar";
import { useAuth } from "./auth-provider";
import styles from "./account-menu.module.css";

const ease = [0.22, 1, 0.36, 1] as const;

const links = [
  {
    href: "/my-account",
    title: "My Account",
    text: "Profile, avatar & password",
    tone: "#e0f2fe",
    icon: <><circle cx="12" cy="8" r="3.4" /><path d="M5 20v-1.5A4.5 4.5 0 0 1 9.5 14h5a4.5 4.5 0 0 1 4.5 4.5V20" /></>,
  },
  {
    href: "/my-courses",
    title: "My Courses",
    text: "Pick up where you left off",
    tone: "#ede9fe",
    icon: <><path d="M5 4.5h12.5A1.5 1.5 0 0 1 19 6v13H7a2 2 0 0 1-2-2V4.5Z" /><path d="M5 17a2 2 0 0 1 2-2h12M9 8.5h6" /></>,
  },
  {
    href: "/pricing",
    title: "Plans & Pricing",
    text: "Bundles and All-Access",
    tone: "#ccfbf1",
    icon: <><path d="M3.5 12.3 11.7 4.1a2 2 0 0 1 1.4-.6H19a1.5 1.5 0 0 1 1.5 1.5v5.9a2 2 0 0 1-.6 1.4l-8.2 8.2a1.5 1.5 0 0 1-2.1 0l-6.1-6.1a1.5 1.5 0 0 1 0-2.1Z" /><circle cx="16" cy="8" r="1.4" /></>,
  },
];

export function AccountMenu({ user }: { user: UserProfile }) {
  const { logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const container = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const [openPath, setOpenPath] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const open = openPath === pathname;

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: PointerEvent) => {
      if (event.target instanceof Node && !container.current?.contains(event.target)) setOpenPath(null);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpenPath(null);
        trigger.current?.focus();
      }
    };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  async function signOut() {
    setBusy(true);
    setError("");
    try {
      await logout();
      router.replace("/");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not sign out. Please try again.");
      setBusy(false);
    }
  }

  return (
    <div className={styles.root} ref={container}>
      <button
        type="button"
        ref={trigger}
        className={styles.trigger}
        aria-label="Account menu"
        aria-expanded={open}
        aria-controls="site-account-settings"
        data-open={open || undefined}
        onClick={() => { setError(""); setOpenPath(open ? null : pathname); }}
      >
        <span className={styles.triggerAvatar}>
          <AccountAvatar user={user} />
          <i className={styles.online} aria-hidden="true" />
        </span>
        <span className={styles.triggerName}>{user.firstName}</span>
        <svg className={styles.chevron} viewBox="0 0 24 24" aria-hidden="true"><path d="m7 10 5 5 5-5" /></svg>
      </button>

      <AnimatePresence>
        {open && (
          <motion.section
            key="panel"
            className={styles.panel}
            id="site-account-settings"
            aria-label="Account menu"
            initial={{ opacity: 0, y: -10, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.97 }}
            transition={{ duration: 0.28, ease }}
          >
            <div className={styles.banner}>
              <span className={styles.bigAvatar}><AccountAvatar user={user} /></span>
              <div className={styles.identity}>
                <strong>{user.firstName} {user.lastName}</strong>
                <p>{user.email}</p>
                <span className={styles.level}>{user.level}</span>
              </div>
            </div>

            <nav className={styles.links} aria-label="Account navigation">
              {links.map((link, index) => (
                <motion.div
                  key={link.href}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, ease, delay: 0.05 + index * 0.05 }}
                >
                  <Link
                    href={link.href}
                    aria-current={pathname === link.href ? "page" : undefined}
                    onClick={() => setOpenPath(null)}
                  >
                    <span className={styles.icon} style={{ background: link.tone }}>
                      <svg viewBox="0 0 24 24" aria-hidden="true">{link.icon}</svg>
                    </span>
                    <span className={styles.linkText}>
                      <strong>{link.title}</strong>
                      <small>{link.text}</small>
                    </span>
                    <svg className={styles.arrow} viewBox="0 0 24 24" aria-hidden="true"><path d="m9 6 6 6-6 6" /></svg>
                  </Link>
                </motion.div>
              ))}
            </nav>

            <button type="button" className={styles.logout} disabled={busy} onClick={signOut}>
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M14 4h3.5A1.5 1.5 0 0 1 19 5.5v13a1.5 1.5 0 0 1-1.5 1.5H14M10 16l-4-4 4-4M6 12h10" /></svg>
              {busy ? "Signing out…" : "Sign out"}
            </button>
            {error && <p className={styles.error} role="alert">{error}</p>}
          </motion.section>
        )}
      </AnimatePresence>
    </div>
  );
}
