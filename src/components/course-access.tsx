"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, useSyncExternalStore } from "react";
import { courses as allCourses, formatCoursePrice, type Course } from "@/lib/catalog";
import type { PlanId } from "@/lib/plans";
import { useAuth } from "./auth-provider";
import styles from "./course-experience.module.css";

const storageKey = (userId: string) => `si-tutor:demo-purchases:${userId}`;
const changeEvent = "si-tutor:demo-purchases-change";
const empty = '{"purchases":{}}';
const methods = ["PayPal", "Stripe (card)", "Afterpay"] as const;

type DemoState = { purchases: Record<string, number> };

// An All-Access Pass is stored under this key and unlocks every course (including ones added later).
export const allAccessKey = "plan:all-access";

function readSnapshot(userId: string) {
  try {
    return localStorage.getItem(storageKey(userId)) ?? empty;
  } catch {
    return empty;
  }
}

function parseState(snapshot: string): DemoState {
  try {
    const state: DemoState = JSON.parse(snapshot);
    if (state.purchases && typeof state.purchases === "object" && !Array.isArray(state.purchases)) return state;
  } catch {
    // Use empty demo state when stored data cannot be read.
  }
  return { purchases: {} };
}

function subscribe(onChange: () => void) {
  window.addEventListener("storage", onChange);
  window.addEventListener(changeEvent, onChange);
  return () => {
    window.removeEventListener("storage", onChange);
    window.removeEventListener(changeEvent, onChange);
  };
}

function updateState(userId: string, update: (state: DemoState) => DemoState) {
  localStorage.setItem(storageKey(userId), JSON.stringify(update(parseState(readSnapshot(userId)))));
  window.dispatchEvent(new Event(changeEvent));
}

export function useDemoAccess(slug?: string) {
  const { user, loading } = useAuth();
  const saved = parseState(useSyncExternalStore(subscribe, () => user ? readSnapshot(user.id) : empty, () => empty));
  const seeded = Object.fromEntries((user?.enrollments ?? []).map((item) => [item.courseSlug, Date.parse(item.expiresAt)]));
  const purchases: Record<string, number> = { ...seeded, ...saved.purchases };
  const allAccess = purchases[allAccessKey];
  if (typeof allAccess === "number" && Number.isFinite(allAccess)) {
    for (const course of allCourses) purchases[course.slug] = Math.max(purchases[course.slug] ?? 0, allAccess);
  }
  const state = { signedIn: !!user, loading, purchases, allAccessExpiry: Number.isFinite(allAccess) ? allAccess : null };
  const value = slug ? state.purchases[slug] : undefined;
  const expiry = typeof value === "number" && Number.isFinite(value) ? value : null;
  const [now, setNow] = useState(() => Date.now());

  const nextExpiry = slug ? expiry : Object.values(state.purchases).reduce<number | null>((next, date) =>
    Number.isFinite(date) && date > now && (next === null || date < next) ? date : next, null);

  useEffect(() => {
    if (nextExpiry === null || nextExpiry <= now) return;
    const timer = window.setTimeout(() => setNow(Date.now()), Math.max(0, Math.min(nextExpiry - Date.now(), 2_147_483_647)));
    return () => window.clearTimeout(timer);
  }, [nextExpiry, now]);

  return { ...state, now, expiry, active: state.signedIn && expiry !== null && expiry > now, expired: expiry !== null && expiry <= now };
}

function expiryAfterPurchase() {
  const expiry = new Date();
  const day = expiry.getDate();
  expiry.setDate(1);
  expiry.setMonth(expiry.getMonth() + 3);
  const lastDay = new Date(expiry.getFullYear(), expiry.getMonth() + 1, 0).getDate();
  expiry.setDate(Math.min(day, lastDay));
  return expiry.getTime();
}

export function CourseAccess({ slug }: { slug: string }) {
  const access = useDemoAccess(slug);
  const base = `/courses/${slug}`;
  const checkout = base + "/checkout";
  const href = access.active ? base + "/learn" : access.signedIn ? checkout : `/login?next=${encodeURIComponent(checkout)}`;
  const label = access.active ? "Continue Learning" : !access.signedIn ? "Log in to buy" : access.expired ? "Buy Again" : "Buy this subject";
  return (
    <div className="my-3">
      <Link className={styles.primaryButton} href={href}>{label}</Link>
      {access.active && access.expiry && <p className="mt-2 text-sm">Access until {new Date(access.expiry).toLocaleDateString("en-AU")}</p>}
      {access.expired && <p className="mt-2 text-sm">Access expired</p>}
    </div>
  );
}

export function DemoCheckout({ course }: { course: Course }) {
  const { user } = useAuth();
  const access = useDemoAccess(course.slug);
  const router = useRouter();
  const [method, setMethod] = useState<(typeof methods)[number]>("Stripe (card)");
  const [error, setError] = useState("");

  if (!access.signedIn || access.active) return <CourseAccess slug={course.slug} />;

  return (
    <form className="mt-5" onSubmit={(event) => {
      event.preventDefault();
      try {
        if (!user) return;
        updateState(user.id, (state) => {
          if ((state.purchases[course.slug] ?? 0) > Date.now()) return state;
          return { ...state, purchases: { ...state.purchases, [course.slug]: expiryAfterPurchase() } };
        });
        router.push(`/courses/${course.slug}/learn`);
      } catch {
        setError("Allow browser storage to save demo access.");
      }
    }}>
      <p className="text-lg font-bold">{formatCoursePrice(course.price)} · 3 months of access</p>
      <p className="mt-2 text-sm text-slate-600">Example checkout. No money will be charged.</p>
      <fieldset className="my-5 grid gap-2">
        <legend className="mb-2 font-semibold">Payment method</legend>
        {methods.map((item) => (
          <label key={item} className="flex cursor-pointer items-center gap-3 rounded-lg border border-blue-100 p-3">
            <input type="radio" name="payment-method" value={item} checked={method === item} onChange={() => setMethod(item)} />
            {item}
          </label>
        ))}
      </fieldset>
      <button type="submit" className={styles.primaryButton}>Simulate purchase</button>
      {error && <p role="alert" className="mt-3 text-red-700">{error}</p>}
    </form>
  );
}

/** Demo checkout for the 3-Course Bundle and the All-Access Pass. No money is charged. */
export function PlanCheckout({ plan, price }: { plan: Exclude<PlanId, "single">; price: number }) {
  const { user } = useAuth();
  const access = useDemoAccess();
  const router = useRouter();
  const [method, setMethod] = useState<(typeof methods)[number]>("Stripe (card)");
  const [selected, setSelected] = useState<string[]>([]);
  const [error, setError] = useState("");
  const bundle = plan === "bundle";
  const next = `/pricing/checkout/${plan}`;

  if (access.loading) return <p role="status" className="mt-6 text-slate-500">Loading your account…</p>;
  if (!access.signedIn) {
    return (
      <div className="mt-6 rounded-2xl bg-sky-50 p-5">
        <p className="font-semibold text-slate-900">Log in to continue</p>
        <p className="mt-1 text-sm text-slate-600">Your plan is saved to your SI Tutor account.</p>
        <Link className="mt-4 inline-flex rounded-full bg-sky-200 px-5 py-2.5 text-sm font-bold text-sky-950 hover:bg-sky-300" href={`/login?next=${encodeURIComponent(next)}`}>Log in</Link>
      </div>
    );
  }

  const allActive = access.allAccessExpiry !== null && access.allAccessExpiry > access.now;
  const toggle = (slug: string) => setSelected((current) =>
    current.includes(slug) ? current.filter((item) => item !== slug) : current.length >= 3 ? current : [...current, slug]);

  return (
    <form className="mt-6" onSubmit={(event) => {
      event.preventDefault();
      if (!user) return;
      if (bundle && selected.length !== 3) {
        setError("Choose exactly 3 courses for your bundle.");
        return;
      }
      try {
        const expiry = expiryAfterPurchase();
        updateState(user.id, (state) => {
          const purchases = { ...state.purchases };
          for (const key of bundle ? selected : [allAccessKey]) purchases[key] = Math.max(purchases[key] ?? 0, expiry);
          return { ...state, purchases };
        });
        router.push("/my-courses");
      } catch {
        setError("Allow browser storage to save demo access.");
      }
    }}>
      {allActive && <p className="mb-4 rounded-xl bg-emerald-50 p-3 text-sm text-emerald-800">Your All-Access Pass is active until {new Date(access.allAccessExpiry!).toLocaleDateString("en-AU")}.</p>}
      {bundle && (
        <fieldset className="mb-6">
          <legend className="mb-3 flex w-full items-center justify-between font-semibold text-slate-900">
            Choose 3 courses
            <span className="rounded-full bg-sky-100 px-3 py-1 text-xs font-bold text-sky-900" aria-live="polite">{selected.length} of 3 selected</span>
          </legend>
          <div className="grid max-h-[420px] gap-2 overflow-y-auto pr-1 sm:grid-cols-2">
            {allCourses.map((course) => {
              const checked = selected.includes(course.slug);
              const owned = (access.purchases[course.slug] ?? 0) > access.now;
              return (
                <label key={course.slug} className={`flex cursor-pointer items-start gap-3 rounded-xl border p-3 text-sm transition ${checked ? "border-sky-400 bg-sky-50" : "border-slate-200 hover:border-sky-200"} ${!checked && selected.length >= 3 ? "opacity-50" : ""}`}>
                  <input type="checkbox" className="mt-0.5 h-4 w-4 accent-sky-600" checked={checked} disabled={!checked && selected.length >= 3} onChange={() => toggle(course.slug)} />
                  <span>
                    <span className="block font-medium text-slate-900">{course.title}</span>
                    {owned && <span className="text-xs text-emerald-700">Already active · access will be extended</span>}
                  </span>
                </label>
              );
            })}
          </div>
        </fieldset>
      )}
      <fieldset className="mb-6 grid gap-2">
        <legend className="mb-2 font-semibold text-slate-900">Payment method</legend>
        {methods.map((item) => (
          <label key={item} className={`flex cursor-pointer items-center gap-3 rounded-xl border p-3 text-sm ${method === item ? "border-sky-400 bg-sky-50" : "border-slate-200"}`}>
            <input type="radio" className="accent-sky-600" name="payment-method" value={item} checked={method === item} onChange={() => setMethod(item)} />
            {item}
          </label>
        ))}
      </fieldset>
      <button type="submit" className="w-full rounded-full bg-gradient-to-r from-sky-200 to-sky-300 px-6 py-3.5 text-sm font-bold text-sky-950 shadow-[0_14px_28px_-14px_rgba(14,165,233,0.7)] transition hover:-translate-y-0.5 disabled:opacity-60" disabled={bundle && selected.length !== 3}>
        Simulate purchase · ${price}
      </button>
      <p className="mt-3 text-center text-xs text-slate-500">Example checkout. No money will be charged. Access lasts 3 months.</p>
      {error && <p role="alert" className="mt-3 text-sm text-red-700">{error}</p>}
    </form>
  );
}

export function DemoLibrary({ courses }: { courses: Pick<Course, "slug" | "title">[] }) {
  const { user, logout } = useAuth();
  const { signedIn, purchases, loading } = useDemoAccess();
  const [error, setError] = useState("");
  const [loggingOut, setLoggingOut] = useState(false);
  if (loading) return <p role="status">Loading your courses…</p>;
  if (!signedIn) return <Link className={styles.primaryButton} href="/login?next=/my-courses">Log In</Link>;

  const purchased = courses.filter(({ slug }) => purchases[slug]);
  return (
    <>
      {user && <p className="my-4 text-slate-600">Welcome, <strong className="text-slate-900">{user.firstName} {user.lastName}</strong> · {user.level}</p>}
      {purchased.length ? (
        <ul className="my-4 grid gap-4">
          {purchased.map(({ slug, title }) => (
            <li key={slug} className="rounded-xl border border-blue-100 p-4">
              <Link className="font-bold hover:underline" href={`/courses/${slug}`}>{title}</Link>
              <CourseAccess slug={slug} />
            </li>
          ))}
        </ul>
      ) : <p className="my-4">Choose a subject to start your demo library.</p>}
      <div className="flex flex-wrap items-center gap-4">
        <Link className={styles.outlineButton} href="/subjects">Browse Subjects</Link>
        <button type="button" className={styles.outlineButton} disabled={loggingOut} onClick={async () => {
          setLoggingOut(true);
          try {
            await logout();
          } catch {
            setError("Unable to clear the demo login in this browser.");
          } finally {
            setLoggingOut(false);
          }
        }}>{loggingOut ? "Logging out…" : "Log Out"}</button>
      </div>
      {error && <p role="alert" className="mt-3 text-red-700">{error}</p>}
    </>
  );
}
