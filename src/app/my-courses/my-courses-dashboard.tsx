"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

import { useAuth } from "@/components/auth-provider";
import { useDemoAccess } from "@/components/course-access";
import { getCompletedLessons, lessonStorageKey, useSavedValue } from "@/components/lesson-progress";
import { subjects, type Course } from "@/lib/catalog";

import styles from "./my-courses.module.css";

function CourseCard({ course, expiry, now, userId, featured = false }: { course: Course; expiry: number; now: number; userId: string; featured?: boolean }) {
  const lessons = course.sections.flatMap((section) => section.lessons);
  const [saved] = useSavedValue(`${lessonStorageKey(course.slug, userId)}:completed`);
  const completed = getCompletedLessons(saved, lessons.map((lesson) => lesson.id)).size;
  const progress = lessons.length ? Math.round((completed / lessons.length) * 100) : 0;
  const active = expiry > now;
  const subject = subjects.find((item) => item.slug === course.subjectSlug);
  const date = new Intl.DateTimeFormat("en-AU", { day: "numeric", month: "short", year: "numeric" }).format(expiry);

  return (
    <li className={`${styles.courseCard} ${featured ? styles.featuredCard : ""}`}>
      <Link className={styles.coverLink} href={`/courses/${course.slug}`} aria-label={`View details for ${course.title}`}>
        <Image src={course.cover} alt="" fill sizes={featured ? "(max-width: 700px) 100vw, 45vw" : "(max-width: 700px) 100vw, 50vw"} className={styles.cover} />
      </Link>
      <div className={styles.cardBody}>
        {featured && <p className={styles.featuredEyebrow}>CONTINUE LEARNING</p>}
        <div className={styles.cardTopline}>
          <span className={styles.subject}>{subject?.name ?? "Course"}</span>
          <span className={active ? styles.activeBadge : styles.expiredBadge}>{active ? "Active" : "Access ended"}</span>
        </div>
        <h2><Link href={`/courses/${course.slug}`}>{course.title}</Link></h2>
        <p className={styles.cardDescription}>{course.description}</p>
        <div className={styles.progressHeading}>
          <span>Learning progress</span>
          <strong>{progress}%</strong>
        </div>
        <progress className={styles.progress} max={100} value={progress} aria-label={`${course.title} learning progress`} />
        <p className={styles.lessonCount}>{completed} of {lessons.length} lessons completed</p>
        <div className={styles.cardFooter}>
          <div className={styles.accessDate}>
            <span>{active ? "Access until" : "Access ended"}</span>
            <strong>{date}</strong>
          </div>
          <Link className={styles.courseAction} href={`/courses/${course.slug}/${active ? "learn" : "checkout"}`}>
            {active ? "Continue learning" : "Renew access"}<span aria-hidden="true">↗</span>
          </Link>
        </div>
      </div>
    </li>
  );
}

export function MyCoursesDashboard({ catalog: courses }: { catalog: Course[] }) {
  const { user, logout } = useAuth();
  const { signedIn, purchases: owned, allAccessExpiry, loading, now } = useDemoAccess();
  // The All-Access Pass also covers courses an admin added after the pass was bought.
  const purchases: Record<string, number> = Object.fromEntries(courses.map(({ slug }) => [slug, owned[slug] ?? allAccessExpiry ?? NaN]));
  const [loggingOut, setLoggingOut] = useState(false);
  const [error, setError] = useState("");

  if (loading) return <main id="main-content" tabIndex={-1} className={styles.page}><p role="status" className={styles.loading}>Loading your courses…</p></main>;

  if (!signedIn || !user) return (
    <main id="main-content" tabIndex={-1} className={styles.page}>
      <div className={styles.emptyState}>
        <span className={styles.emptyIcon} aria-hidden="true">◫</span>
        <p className={styles.eyebrow}>YOUR LEARNING SPACE</p>
        <h1>My Courses</h1>
        <p>Log in to see your courses and pick up where you left off.</p>
        <Link className={styles.primaryLink} href="/login?next=/my-courses">Log in <span aria-hidden="true">↗</span></Link>
        <Link className={styles.secondaryTextLink} href="/subjects">Browse subjects</Link>
      </div>
    </main>
  );

  const purchased = courses.filter(({ slug }) => Number.isFinite(purchases[slug]) && purchases[slug] > 0);
  const activeCount = purchased.filter(({ slug }) => purchases[slug] > now).length;
  const expiredCount = purchased.length - activeCount;
  const featured = purchased.find(({ slug }) => purchases[slug] > now);
  const remaining = purchased.filter(({ slug }) => slug !== featured?.slug);

  return (
    <main id="main-content" tabIndex={-1} className={styles.page}>
      <div className={styles.intro}>
        <div>
          <p className={styles.eyebrow}>YOUR LEARNING SPACE</p>
          <h1>My Courses<span>.</span></h1>
          <p className={styles.greeting}>Welcome back, <strong>{user.firstName} {user.lastName}</strong> <span aria-hidden="true">·</span> {user.level}</p>
        </div>
        <Link className={styles.browseLink} href="/subjects">Browse subjects <span aria-hidden="true">↗</span></Link>
      </div>

      <p className={styles.summary} aria-label="Course summary">
        <strong>{activeCount}</strong> active {activeCount === 1 ? "course" : "courses"}
        <span aria-hidden="true">·</span>
        <strong>{purchased.length}</strong> in your library
        {expiredCount > 0 && <><span aria-hidden="true">·</span><strong>{expiredCount}</strong> access ended</>}
      </p>

      {featured && (
        <section className={styles.featuredSection} aria-labelledby="featured-heading">
          <h2 id="featured-heading" className={styles.visuallyHidden}>Continue learning</h2>
          <ul className={styles.featuredList}>
            <CourseCard course={featured} expiry={purchases[featured.slug]} now={now} userId={user.id} featured />
          </ul>
        </section>
      )}

      <div className={styles.sectionHeading}>
        <div><p className={styles.eyebrow}>ALL YOUR COURSES</p><h2>{featured ? "Your other courses" : "Your library"}</h2></div>
        <span>{remaining.length} {remaining.length === 1 ? "course" : "courses"}</span>
      </div>

      {remaining.length ? (
        <ul className={styles.courseGrid}>
          {remaining.map((course) => <CourseCard key={course.slug} course={course} expiry={purchases[course.slug]} now={now} userId={user.id} />)}
        </ul>
      ) : !featured ? (
        <div className={styles.emptyLibrary}>
          <span className={styles.emptyIcon} aria-hidden="true">◫</span>
          <h3>Your library is ready for its first course.</h3>
          <p>Explore subjects and choose a course that sparks your curiosity.</p>
          <Link className={styles.primaryLink} href="/subjects">Explore subjects <span aria-hidden="true">↗</span></Link>
        </div>
      ) : <p className={styles.allCaughtUp}>Your other courses will appear here.</p>}

      <div className={styles.pageFooter}>
        <span>Learning looks good on you. Keep going.</span>
        <button type="button" disabled={loggingOut} onClick={async () => {
          setLoggingOut(true);
          setError("");
          try { await logout(); }
          catch { setError("Unable to log out. Please try again."); }
          finally { setLoggingOut(false); }
        }}>{loggingOut ? "Logging out…" : "Log out"}</button>
      </div>
      {error && <p role="alert" className={styles.error}>{error}</p>}
    </main>
  );
}
