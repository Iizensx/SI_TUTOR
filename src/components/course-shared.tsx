import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import type { Course, Lesson, Subject } from "@/lib/catalog";
import styles from "./course-experience.module.css";

const iconPaths = {
  arrow: "M4 12h15m-6-6 6 6-6 6",
  back: "M20 12H5m6-6-6 6 6 6",
  check: "m5 12 4 4L19 6",
  clock: "M12 7v5l3 2m6-2a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z",
  book: "M12 6c-3-2-6-2-9-1v13c3-1 6-1 9 1 3-2 6-2 9-1V5c-3-1-6-1-9 1Zm0 0v13",
  chevron: "m7 10 5 5 5-5",
  lock: "M7 11V8a5 5 0 0 1 10 0v3M5 11h14v9H5z",
  play: "m9 6 10 6-10 6V6Z",
} as const;

export function CourseIcon({ name }: { name: keyof typeof iconPaths }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d={iconPaths[name]} />
    </svg>
  );
}

export function CourseHero({
  course, subject, children, wide = false, showDescription = false,
}: {
  course: Course;
  subject: Subject;
  children: ReactNode;
  wide?: boolean;
  showDescription?: boolean;
}) {
  return (
    <section className={wide ? `${styles.hero} ${styles.heroWide}` : styles.hero} aria-labelledby="course-title">
      <Image className={styles.heroImage} src={course.cover} alt="" fill sizes="(max-width: 1200px) 100vw, 1180px" preload />
      <div className={styles.heroBody}>
        <div className={styles.heroBadges}>
          <span>{subject.name}</span>
        </div>
        <h1 id="course-title">{course.title}</h1>
        {showDescription && <p className={styles.heroDescription}>{course.description}</p>}
        <ul className={styles.heroMeta}>
          <li><CourseIcon name="clock" /> {course.duration}</li>
          <li><CourseIcon name="book" /> {course.lessonCount} lesson{course.lessonCount === 1 ? "" : "s"}</li>
        </ul>
        {children}
      </div>
    </section>
  );
}

export function Curriculum({
  course, selected, completed, onSelect,
}: {
  course: Course;
  selected?: string;
  completed?: ReadonlySet<string>;
  onSelect?: (lesson: Lesson) => void;
}) {
  const firstLesson = course.sections[0]?.lessons[0]?.id;
  const lessonNumbers = new Map(
    course.sections.flatMap(({ lessons }) => lessons).map(({ id }, index) => [id, index + 1]),
  );

  return (
    <div className={styles.curriculum}>
      {course.sections.map((section, index) => (
        <details key={section.title} className={styles.curriculumSection} open={Boolean(onSelect) || index === 0}>
          <summary>
            <CourseIcon name="chevron" />
            <span>Section {index + 1}: {section.title}</span>
            <small>{section.lessons.length} {section.lessons.length === 1 ? "lesson" : "lessons"}</small>
          </summary>
          <ol>
            {section.lessons.map((lesson) => {
              const lessonNumber = lessonNumbers.get(lesson.id);
              const isPreview = lesson.id === firstLesson;
              const isActive = lesson.id === selected;
              const isCompleted = Boolean(completed?.has(lesson.id));
              const row = (
                <>
                  <span className={styles.lessonIcon} aria-label={isCompleted ? "Completed" : undefined}>
                    <CourseIcon name={isCompleted ? "check" : onSelect || isPreview ? "play" : "lock"} />
                  </span>
                  <span className={styles.lessonName}>{String(lessonNumber).padStart(2, "0")}. {lesson.title}</span>
                  {isPreview && <span className={styles.previewBadge}>Preview</span>}
                  <span className={styles.lessonDuration}>{lesson.duration}</span>
                </>
              );
              return (
                <li key={lesson.id}>
                  {onSelect ? (
                    <button className={styles.lessonRow} type="button" aria-current={isActive ? "step" : undefined} onClick={() => onSelect(lesson)}>{row}</button>
                  ) : isPreview ? (
                    <Link className={styles.lessonRow} href={`/courses/${course.slug}/learn?preview=1`}>{row}</Link>
                  ) : (
                    <span className={styles.lessonRow}>{row}</span>
                  )}
                </li>
              );
            })}
          </ol>
        </details>
      ))}
    </div>
  );
}
