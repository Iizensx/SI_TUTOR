"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { MotionConfig, motion } from "framer-motion";
import { Toaster } from "sonner";
import {
  BarChart3, Bell, BookOpen, Clapperboard, Globe, LayoutDashboard, LogOut, Palette, Receipt, Search, Settings, ShieldCheck, Users,
} from "lucide-react";

import { useAuth } from "@/components/auth-provider";
import { AccountAvatar } from "@/components/account-avatar";
import { AdminProvider, useAdmin } from "../_lib/admin-context";
import styles from "../admin.module.css";

const nav = [
  { href: "/admin", label: "Overview", icon: LayoutDashboard },
  { href: "/admin/courses", label: "Subjects & Courses", icon: BookOpen },
  { href: "/admin/lessons", label: "Lessons & Files", icon: Clapperboard },
  { href: "/admin/orders", label: "Orders & Payments", icon: Receipt },
  { href: "/admin/students", label: "Students & Access", icon: Users },
  { href: "/admin/reports", label: "Reports", icon: BarChart3 },
  { href: "/admin/settings", label: "Settings", icon: Settings },
];

const themes = ["forest", "pink", "ocean", "violet", "amber"] as const;
type AdminTheme = (typeof themes)[number];
const themeNames: Record<AdminTheme, string> = {
  forest: "Forest", pink: "Pink", ocean: "Ocean", violet: "Violet", amber: "Amber",
};

function Rail({ onRandomTheme, theme }: { onRandomTheme: () => void; theme: AdminTheme }) {
  const pathname = usePathname();
  const { logout } = useAuth();
  const router = useRouter();
  return (
    <div className={styles.railWrap}>
      <nav className={styles.rail} aria-label="Admin navigation">
        <Link href="/admin" className={styles.logo} aria-label="SI Tutor admin home"><span className="inline-flex"><span className="text-[var(--accent)]">S</span>I</span></Link>
        {nav.map(({ href, label, icon: Icon }) => {
          const active = href === "/admin" ? pathname === "/admin" : pathname.startsWith(href);
          return (
            <Link key={href} href={href} className={styles.railLink} aria-current={active ? "page" : undefined} aria-label={label}>
              {active && <motion.span layoutId="rail-active" className={styles.railActive} transition={{ type: "spring", stiffness: 420, damping: 34 }} />}
              <Icon size={20} strokeWidth={1.8} />
              <span className={styles.tooltip}>{label}</span>
            </Link>
          );
        })}
        <span className={styles.railSpacer} />
        <button type="button" className={`${styles.railLink} ${styles.themeButton}`} aria-label={`Random color theme, current: ${themeNames[theme]}`} onClick={onRandomTheme}>
          <Palette size={20} strokeWidth={1.8} />
          <span className={styles.tooltip}>Random theme · {themeNames[theme]}</span>
        </button>
        <Link href="/" className={styles.railLink} aria-label="View website">
          <Globe size={20} strokeWidth={1.8} />
          <span className={styles.tooltip}>View website</span>
        </Link>
        <button type="button" className={styles.railLink} aria-label="Sign out" onClick={async () => { await logout(); router.replace("/login"); }}>
          <LogOut size={20} strokeWidth={1.8} />
          <span className={styles.tooltip}>Sign out</span>
        </button>
      </nav>
    </div>
  );
}

function Topbar() {
  const { state } = useAdmin();
  const router = useRouter();
  const [query, setQuery] = useState("");
  const pending = state?.orders.filter((order) => order.status === "pending" || order.status === "refund_requested").length ?? 0;
  const today = new Date().toLocaleDateString("en-AU", { weekday: "short", day: "numeric", month: "long", year: "numeric" });
  return (
    <header className={styles.topbar}>
      <form
        className={`${styles.glass} flex h-12 w-full max-w-[420px] items-center gap-2 rounded-full px-4`}
        role="search"
        onSubmit={(event) => { event.preventDefault(); if (query.trim()) router.push(`/admin/orders?q=${encodeURIComponent(query.trim())}`); }}
      >
        <Search size={17} className="text-[var(--muted)]" aria-hidden="true" />
        <input
          className="h-full w-full bg-transparent text-sm outline-none placeholder:text-[var(--muted)]"
          placeholder="Search orders by student, email, course or order ID…"
          aria-label="Search orders"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
      </form>
      <div className="flex items-center gap-2">
        <span className={`${styles.glass} hidden h-12 items-center rounded-full px-4 text-sm font-medium text-[var(--muted)] md:inline-flex`}>{today}</span>
        <Link href="/admin/orders?status=review" className={`${styles.glass} relative grid h-12 w-12 place-items-center rounded-full`} aria-label={`${pending} payments and refunds to review`}>
          <Bell size={18} />
          {pending > 0 && <span className="absolute -right-0.5 -top-0.5 grid h-5 min-w-5 place-items-center rounded-full bg-[var(--accent)] px-1 text-[10px] font-bold text-[var(--accent-ink)]">{pending}</span>}
        </Link>
        {state && (
          <span className={`${styles.glass} flex h-12 items-center gap-2.5 rounded-full py-1 pl-1.5 pr-4`} style={{ ["--avatar-size" as string]: "38px" }}>
            <AccountAvatar user={state.me} />
            <span className="leading-tight">
              <strong className="block text-sm">{state.me.firstName}</strong>
              <span className="flex items-center gap-1 text-[11px] capitalize text-[var(--muted)]"><ShieldCheck size={11} />{state.me.adminRole}</span>
            </span>
          </span>
        )}
      </div>
    </header>
  );
}

function Guard({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  const { state, error, loading: dataLoading } = useAdmin();
  if (loading || (user?.role === "admin" && dataLoading)) {
    return (
      <div className={`${styles.root} !block p-6`} role="status" aria-label="Loading admin dashboard">
        <div className="mx-auto grid max-w-6xl gap-4">{[0, 1, 2].map((key) => <div key={key} className="h-40 animate-pulse rounded-[26px] bg-white/60" />)}</div>
      </div>
    );
  }
  if (!user || user.role !== "admin" || !state) {
    return (
      <main id="main-content" className={`${styles.root} !flex items-start justify-center p-6`}>
      <div className={`${styles.glass} mx-auto mt-16 max-w-md rounded-[28px] p-8 text-center`}>
        <ShieldCheck className="mx-auto text-[var(--deep)]" size={36} />
        <h1 className="mt-3 text-xl font-semibold">Admins only</h1>
        <p className="mt-2 text-sm text-[var(--muted)]">{error && user ? error : "Log in with an admin account to open the dashboard."}</p>
        <div className="mt-5 flex justify-center gap-2">
          <Link href="/login?next=/admin" className="rounded-full bg-[var(--deep)] px-5 py-2.5 text-sm font-semibold text-white">Log in</Link>
          <Link href="/" className="rounded-full bg-white px-5 py-2.5 text-sm font-semibold ring-1 ring-[var(--line)]">Back to site</Link>
        </div>
      </div>
      </main>
    );
  }
  return <>{children}</>;
}

function MobileNav() {
  const pathname = usePathname();
  return (
    <nav className={styles.mobileNav} aria-label="Admin navigation">
      {nav.map(({ href, label }) => (
        <Link key={href} href={href} aria-current={(href === "/admin" ? pathname === "/admin" : pathname.startsWith(href)) ? "page" : undefined}>{label}</Link>
      ))}
    </nav>
  );
}

export function AdminShell({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<AdminTheme>("forest");
  useEffect(() => {
    try {
      const saved = localStorage.getItem("si-tutor:admin-theme");
      if (themes.some((item) => item === saved)) setTheme(saved as AdminTheme);
    } catch { /* The default theme works without local storage. */ }
  }, []);
  function randomTheme() {
    const choices = themes.filter((item) => item !== theme);
    const next = choices[Math.floor(Math.random() * choices.length)];
    setTheme(next);
    try { localStorage.setItem("si-tutor:admin-theme", next); } catch { /* Theme remains active for this visit. */ }
  }
  return (
    <MotionConfig reducedMotion="user">
      <AdminProvider>
        <Guard>
          <div className={styles.root} data-theme={theme}>
            <Rail onRandomTheme={randomTheme} theme={theme} />
            <div className="min-w-0">
              <MobileNav />
              <main id="main-content" tabIndex={-1} className={styles.main}>
                <Topbar />
                {children}
              </main>
            </div>
          </div>
        </Guard>
        <Toaster position="bottom-right" richColors closeButton toastOptions={{ style: { borderRadius: 16, fontFamily: "inherit" } }} />
      </AdminProvider>
    </MotionConfig>
  );
}
