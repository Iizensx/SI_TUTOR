"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AccountMenu } from "./account-menu";
import { useAuth } from "./auth-provider";

import styles from "./site-header.module.css";

export function SiteHeader() {
  const pathname = usePathname();
  const { user, loading } = useAuth();
  const [openPath, setOpenPath] = useState<string | null>(null);
  const menuOpen = openPath === pathname;
  if (pathname === "/login" || pathname === "/signup" || pathname.startsWith("/admin")) return null;

  const inSubjects =
    pathname === "/subjects" ||
    pathname.startsWith("/subjects/") ||
    pathname.startsWith("/courses/");
  const closeMenu = () => setOpenPath(null);

  return (
    <header className={styles.header}>
      <Link className={styles.brand} href="/" aria-label="SI Tutor home" onClick={closeMenu}>
        <Image className={styles.brandRobot} src="/catalog/brand-robot.jpg" alt="" width={48} height={48} />
        <span className={styles.brandCopy}>
          <span className={styles.brandName}><span>SI</span> TUTOR</span>
          <span className={styles.brandTagline}>Super Intelligence Tutor</span>
        </span>
      </Link>

      <button
        className={styles.mobileToggle}
        type="button"
        aria-label={menuOpen ? "Close menu" : "Open menu"}
        aria-expanded={menuOpen}
        aria-controls="site-mobile-menu"
        onClick={() => setOpenPath(menuOpen ? null : pathname)}
      >
        <span aria-hidden="true" />
        <span aria-hidden="true" />
        <span aria-hidden="true" />
      </button>

      <div id="site-mobile-menu" className={styles.headerContent} data-open={menuOpen || undefined}>
        <nav className={styles.navigation} aria-label="Main navigation">
          <Link href="/" aria-current={pathname === "/" ? "page" : undefined} onClick={closeMenu}>Home</Link>
          <Link href="/subjects" aria-current={pathname === "/subjects" ? "page" : inSubjects ? "location" : undefined} onClick={closeMenu}>
            Subjects
          </Link>
          <Link href="/pricing" aria-current={pathname === "/pricing" ? "page" : undefined} onClick={closeMenu}>Pricing</Link>
          <Link href="/about" aria-current={pathname === "/about" ? "page" : undefined} onClick={closeMenu}>About</Link>
        </nav>

        <div className={styles.actions}>
          {loading ? <span role="status" aria-label="Loading account">…</span> : user ? (
            <AccountMenu key={user.id} user={user} />
          ) : (
            <>
              <Link className={styles.login} href="/login" onClick={closeMenu}>Log in</Link>
              <Link className={styles.signup} href="/signup" onClick={closeMenu}>Sign up</Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}