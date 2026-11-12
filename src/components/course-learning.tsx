"use client";

import Image from "next/image";
import Link from "next/link";
import { useRef, useState, useSyncExternalStore } from "react";
import type { Course, Lesson, Subject } from "@/lib/catalog";
import { CourseHero, CourseIcon, Curriculum } from "./course-shared";
import styles from "./course-experience.module.css";

const storageChange = "si-tutor-lesson-storage";
const inMemory = new Map<string, string>();

function subscribe(onChange: () => void) {
  window.addEventListener("storage", onChange);
  window.addEventListener(storageChange, onChange);
  return () => {
    window.removeEventListener("storage", onChange);
    window.removeEventListener(storageChange, onChange);
  };
}

function useSavedValue(key: string) {
  const value = useSyncExternalStore(
    subscribe,
    () => {
      try {
        return window.localStorage.getItem(key) ?? inMemory.get(key) ?? "";
      } catch {
        return inMemory.get(key) ?? "";
      }
    },
    () => "",
  );

  function save(next: string) {
    inMemory.set(key, next);
    try {
      window.localStorage.setItem(key, next);
    } catch {
      // Keep the value available in this tab when storage is unavailable.
    }
    window.dispatchEvent(new Event(storageChange));
  }

  return [value, save] as const;
}

function LessonNotes({ storageKey }: { storageKey: string }) {
  const [savedNote, saveNote] = useSavedValue(storageKey);
  const [draft, setDraft] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  return (
    <form className={styles.notes} onSubmit={(event) => {
      event.preventDefault();
      saveNote(draft ?? savedNote);
      setDraft(null);
      setSaved(true);
    }}>
      <label htmlFor="lesson-notes">Your notes</label>
      <textarea
        id="lesson-notes"
        rows={5}
        maxLength={4000}
        value={draft ?? savedNote}
        onChange={(event) => { setDraft(event.target.value); setSaved(false); }}
        placeholder="Write down what you want to remember."
      />
      <div>
        <button className={styles.outlineButton} type="submit">Save notes</button>
        <span role="status">{saved ? "Notes saved in this browser." : ""}</span>
      </div>
    </form>
  );
}

export function LearningRoom({ course, subject, preview }: { course: Course; subject: Subject; preview: boolean }) {
  const lessons = course.sections.flatMap(({ lessons }) => lessons);
  const [tab, setTab] = useState<"overview" | "notes">("overview");
  const headingRef = useRef<HTMLHeadingElement>(null);
  const keyPrefix = `si-tutor:course:${course.slug}`;
  const [savedProgress, saveProgress] = useSavedValue(`${keyPrefix}:completed`);
  const completed = new Set(savedProgress.split(",").filter((id) => lessons.some((lesson) => lesson.id === id)));
  const progress = lessons.length ? Math.round((completed.size / lessons.length) * 100) : 0;
  const [savedLesson, saveLesson] = useSavedValue(`${keyPrefix}:current`);
  const selected = preview ? 0 : Math.max(0, lessons.findIndex(({ id }) => id === savedLesson));
  const lesson = lessons[selected];

  function selectLesson(next: Lesson) {
    saveLesson(next.id);
    setTab("overview");
    requestAnimationFrame(() => headingRef.current?.focus());
  }

  return (
    <>
      <CourseHero course={course} subject={subject} wide>
        <div className={styles.heroActions}>
          {preview ? (
            <p className={styles.previewLabel}>Course Preview</p>
          ) : (
            <div className={styles.progress}>
              <label htmlFor="course-progress">Your Progress <strong>{progress}%</strong></label>
              <progress id="course-progress" max={100} value={progress}>{progress}%</progress>
            </div>
          )}
          {preview ? (
            <Link className={styles.primaryButton} href={`/courses/${course.slug}/learn`}>Open Demo Course <CourseIcon name="arrow" /></Link>
          ) : lesson && (
            <a className={styles.primaryButton} href="#lesson"><CourseIcon name="play" /> Continue Learning</a>
          )}
        </div>
      </CourseHero>

      {lesson ? (
        <div className={preview ? styles.previewLayout : styles.learnGrid}>
          <article className={styles.lessonPanel} id="lesson" aria-labelledby="lesson-title">
            <header className={styles.lessonHeader}>
              <h2 id="lesson-title" ref={headingRef} tabIndex={-1}>{String(selected + 1).padStart(2, "0")}. {lesson.title}</h2>
              {selected === 0 && <span className={styles.previewBadge}>Preview</span>}
              <span className={styles.lessonDuration}>{lesson.duration}</span>
            </header>
            <figure className={styles.lessonMedia}>
              <Image src={course.cover} alt="" fill sizes="(max-width: 860px) 100vw, 590px" />
              <figcaption>Illustrated lesson preview</figcaption>
            </figure>
            {!preview && (
              <div className={styles.lessonTabs} role="group" aria-label="Lesson resources">
                <button type="button" aria-pressed={tab === "overview"} onClick={() => setTab("overview")}>Overview</button>
                <button type="button" aria-pressed={tab === "notes"} onClick={() => setTab("notes")}>Notes</button>
              </div>
            )}
            {tab === "overview" || preview ? (
              <div className={styles.lessonOverview}>
                <h3>About This Lesson</h3>
                <p>{lesson.description}</p>
                <section className={styles.takeaways}>
                  <h4>Key Takeaways</h4>
                  <ul>{lesson.takeaways.map((takeaway) => <li key={takeaway}><CourseIcon name="check" /> {takeaway}</li>)}</ul>
                </section>
              </div>
            ) : (
              <LessonNotes key={lesson.id} storageKey={`${keyPrefix}:note:${lesson.id}`} />
            )}
            {!preview && (
              <>
                <button
                  type="button"
                  className={styles.completeButton}
                  aria-pressed={completed.has(lesson.id)}
                  onClick={() => {
                    const next = completed.has(lesson.id)
                      ? [...completed].filter((id) => id !== lesson.id)
                      : [...completed, lesson.id];
                    saveProgress(next.join(","));
                  }}
                >
                  <CourseIcon name="check" /> {completed.has(lesson.id) ? "Completed" : "Mark as complete"}
                </button>
                <nav className={styles.lessonNavigation} aria-label="Lesson navigation">
                  <button className={styles.outlineButton} disabled={selected === 0} type="button" onClick={() => selectLesson(lessons[selected - 1])}>
                    <CourseIcon name="back" /> Previous Lesson
                  </button>
                  <button className={styles.primaryButton} disabled={selected === lessons.length - 1} type="button" onClick={() => selectLesson(lessons[selected + 1])}>
                    Next Lesson <CourseIcon name="arrow" />
                  </button>
                </nav>
              </>
            )}
          </article>
          {!preview && (
            <section className={styles.courseContent} aria-labelledby="course-content-title">
              <h2 id="course-content-title">Course Content</h2>
              <Curriculum course={course} selected={lesson.id} completed={completed} onSelect={selectLesson} />
            </section>
          )}
        </div>
      ) : (
        <p className={styles.emptyLesson}>This course has no published lessons yet.</p>
      )}
    </>
  );
}
