"use client";

import Image from "next/image";
import Link from "next/link";

import { CatalogIcon } from "@/components/catalog-shell";
import { useDemoAccess } from "@/components/course-access";
import { getCompletedLessons, lessonStorageKey, useSavedValue } from "@/components/lesson-progress";
import { courses, type Course } from "@/lib/catalog";

import styles from "./continue-courses.module.css";

const examples = [
  { slug: "hsc-mathematics", percent: 65 },
  { slug: "introduction-to-ai-and-ml", percent: 40 },
  { slug: "ielts-speaking", percent: 25 },
];

function ContinueCourseCard({ course }: { course: Course }) {
  const key = lessonStorageKey(course.slug);
  const [completion] = useSavedValue(key + ":completed");
  const [current] = useSavedValue(key + ":current");
  const lessons = course.sections.flatMap((section) => section.lessons);
  const completed = getCompletedLessons(completion, lessons.map(({ id }) => id));
  const percent = lessons.length ? Math.round(100 * completed.size / lessons.length) : 0;
  const next = lessons.find(({ id }) => id === current) ?? lessons[0];
  return <ProgressCard course={course} subtitle={next?.title} percent={percent} href={`/courses/${course.slug}/learn`} />;
}

function ProgressCard({ course, subtitle, percent, href }: {
  course: Course;
  subtitle?: string;
  percent: number;
  href: string;
}) {

  return (
    <li>
      <Link className={styles.card} href={href} title={course.title}>
        <div className={styles.courseInfo}>
          <Image className={styles.cover} src={course.cover} alt="" width={54} height={48} />
          <div>
            <h3>{course.title}</h3>
            {subtitle && <p>{subtitle}</p>}
          </div>
        </div>
        <div className={styles.progress}>
          <progress aria-label={course.title + " progress"} max={100} value={percent} />
          <span>{percent}%</span>
        </div>
      </Link>
    </li>
  );
}

export function ContinueCourses() {
  const [panelState, savePanelState] = useSavedValue("si-tutor:continue-courses-panel");
  const collapsed = panelState === "collapsed";
  const { signedIn, purchases, now } = useDemoAccess();
  const available = signedIn
    ? courses.filter(({ slug }) => Number.isFinite(purchases[slug]) && purchases[slug] > now)
      .sort((first, second) => purchases[second.slug] - purchases[first.slug])
    : [];

  return (
    <aside className={styles.panel} data-collapsed={collapsed || undefined} aria-labelledby="continue-courses-title">
      <div className={styles.heading}>
        <h2 id="continue-courses-title">Continue Course</h2>
        {signedIn && !collapsed && <Link href="/my-courses">See all</Link>}
        <button
          type="button"
          className={styles.toggle}
          aria-label={collapsed ? "Expand Continue Course" : "Collapse Continue Course"}
          title={collapsed ? "Expand Continue Course" : "Collapse Continue Course"}
          aria-expanded={!collapsed}
          aria-controls="continue-courses-content"
          onClick={() => savePanelState(collapsed ? "" : "collapsed")}
        >
          <CatalogIcon name="chevron" size={18} />
        </button>
      </div>
      <div id="continue-courses-content">
        {available.length > 0 ? (
          <ul className={styles.list}>
            {available.slice(0, 4).map((course) => <ContinueCourseCard key={course.slug} course={course} />)}
          </ul>
        ) : (
          <>
            <ul className={styles.list} aria-label="Example course progress">
              {examples.map(({ slug, percent }) => {
                const course = courses.find((item) => item.slug === slug);
                return course && (
                  <ProgressCard key={slug} course={course} subtitle="Example progress" percent={percent} href={`/courses/${slug}`} />
                );
              })}
            </ul>
            {signedIn && <div className={styles.empty} hidden={collapsed}>
              <p>Your active courses will appear here.</p>
              <Link className={styles.action} href="/my-courses">
                My Courses <CatalogIcon name="arrow" size={15} />
              </Link>
            </div>}
          </>
        )}
      </div>
    </aside>
  );
}
