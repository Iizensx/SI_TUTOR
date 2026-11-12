"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";

import styles from "./site-header.module.css";

export function SiteHeader() {
  const pathname = usePathname();
  const inSubjects =
    pathname === "/subjects" ||
    pathname.startsWith("/subjects/") ||
    pathname.startsWith("/courses/");

  return (
    <header className={styles.header}>
      <Link className={styles.brand} href="/" aria-label="SI Tutor home">
        <Image className={styles.brandRobot} src="/catalog/brand-robot.jpg" alt="" width={48} height={48} />
        <span className={styles.brandCopy}>
          <span className={styles.brandName}><span>SI</span> TUTOR</span>
          <span className={styles.brandTagline}>Super Intelligence Tutor</span>
        </span>
      </Link>

      <nav className={styles.navigation} aria-label="Main navigation">
        <Link href="/" aria-current={pathname === "/" ? "page" : undefined}>Home</Link>
        <Link href="/subjects" aria-current={pathname === "/subjects" ? "page" : inSubjects ? "location" : undefined}>
          Subjects
        </Link>
        <Link href="/pricing" aria-current={pathname === "/pricing" ? "page" : undefined}>Pricing</Link>
        <Link href="/#about">About</Link>
      </nav>

      <div className={styles.actions}>
        <button className={styles.login} type="button" disabled title="Log in is not available yet">
          Log In
        </button>
        <Link className={styles.start} href="/subjects">Get Started</Link>
      </div>
    </header>
  );
}
