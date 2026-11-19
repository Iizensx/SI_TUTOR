"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import type { UserProfile } from "@/lib/auth-types";
import { AccountAvatar } from "./account-avatar";
import { useAuth } from "./auth-provider";
import styles from "./account-menu.module.css";

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
        aria-label="Account settings"
        aria-expanded={open}
        aria-controls="site-account-settings"
        onClick={() => { setError(""); setOpenPath(open ? null : pathname); }}
      >
        <AccountAvatar user={user} />
      </button>
      <section className={styles.panel} id="site-account-settings" aria-label="Account settings" hidden={!open}>
        <div className={styles.identity}>
          <AccountAvatar user={user} />
          <div><strong>{user.firstName} {user.lastName}</strong><p>{user.email}</p></div>
        </div>
        <nav className={styles.links} aria-label="Account navigation">
          <Link href="/my-account" onClick={() => setOpenPath(null)}>
            <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="8" r="3"/><path d="M5 20v-2a4 4 0 0 1 4-4h6a4 4 0 0 1 4 4v2"/></svg>
            My Account <span aria-hidden="true">›</span>
          </Link>
          <Link href="/my-courses" onClick={() => setOpenPath(null)}>
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 4h14v15H7a2 2 0 0 1-2-2V4Zm0 13a2 2 0 0 1 2-2h12M9 8h6"/></svg>
            My Courses <span aria-hidden="true">›</span>
          </Link>
        </nav>
        <button type="button" className={styles.logout} disabled={busy} onClick={signOut}>{busy ? "Signing out…" : "Sign out"}</button>
        {error && <p className={styles.error} role="alert">{error}</p>}
      </section>
    </div>
  );
}
