"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, type ReactNode } from "react";

import { CatalogIcon } from "@/components/catalog-shell";
import type { Course, Subject } from "@/lib/catalog";

import styles from "./catalog.module.css";

const subjectStyles: Record<string, string> = {
  hsc: styles.hsc,
  ielts: styles.ielts,
  robotics: styles.robotics,
  mathematics: styles.mathematics,
  citizenship: styles.citizenship,
};

function SearchField({
  value,
  onChange,
  placeholder,
  label,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  label: string;
}) {
  return (
    <label className={styles.search}>
      <input
        aria-label={label}
        type="search"
        placeholder={placeholder}
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
      <CatalogIcon name="search" size={17} />
    </label>
  );
}

function Sidebar({ subjects, activeSlug }: { subjects: readonly Subject[]; activeSlug?: string }) {
  const links = [
    { label: "All Subjects", href: "/subjects", icon: "all", active: !activeSlug },
    ...subjects.map((subject) => ({
      label: subject.name,
      href: `/subjects/${subject.slug}`,
      icon: subject.slug,
      active: subject.slug === activeSlug,
    })),
  ];

  return (
    <nav className={styles.sidebar} aria-label="Subject categories">
      <ul>
        {links.map(({ label, href, icon, active }) => (
          <li key={href}>
            <Link href={href} scroll={false} aria-current={active ? "page" : undefined} className={subjectStyles[icon]}>
              <CatalogIcon name={icon} size={20} />
              <span>{label}</span>
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}

function EmptyState({ onReset, message }: { onReset?: () => void; message: string }) {
  return (
    <div className={styles.empty}>
      <p>{message}</p>
      {onReset && <button type="button" onClick={onReset}>Clear filters</button>}
    </div>
  );
}

function CatalogFrame({
  subjects,
  activeSlug,
  search,
  children,
}: {
  subjects: readonly Subject[];
  activeSlug?: string;
  search: ReactNode;
  children: ReactNode;
}) {
  return (
    <>
      <div className={styles.subjectIntro}>
        <div>
          <h1>Subjects</h1>
          <p>Explore all available subjects and find the best course for you.</p>
        </div>
        <div className={styles.subjectSearch}>{search}</div>
      </div>
      <div className={styles.browserLayout}>
        <Sidebar subjects={subjects} activeSlug={activeSlug} />
        {children}
      </div>
    </>
  );
}

export function SubjectBrowser({ subjects }: { subjects: readonly Subject[] }) {
  const [query, setQuery] = useState("");
  const normalized = query.trim().toLowerCase();
  const matchingSubjects = subjects.filter(({ name, description }) =>
    `${name} ${description}`.toLowerCase().includes(normalized),
  );

  return (
    <CatalogFrame
      subjects={subjects}
      search={<SearchField value={query} onChange={setQuery} label="Search subjects" placeholder="What would you like to learn today?" />}
    >
      {matchingSubjects.length > 0 ? (
        <ul className={styles.subjectGrid} aria-label="Subjects">
          {matchingSubjects.map((subject) => (
            <li key={subject.slug} className={subjectStyles[subject.slug]}>
              <Link className={styles.subjectCard} href={`/subjects/${subject.slug}`}>
                <span className={styles.subjectArt}>
                  <Image src={subject.image} alt="" width={180} height={155} sizes="180px" />
                </span>
                <h2>{subject.name}</h2>
                <p>{subject.description}</p>
                <span className={styles.viewCourses}>View Courses <CatalogIcon name="arrow" size={15} /></span>
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <EmptyState onReset={() => setQuery("")} message="No subjects match your search." />
      )}
    </CatalogFrame>
  );
}

function CourseCard({ course, subject }: { course: Course; subject: Subject }) {
  return (
    <article className={styles.courseCard}>
      <Link href={`/courses/${course.slug}`} className={styles.courseLink}>
        <div className={styles.courseMedia}>
          <Image
            src={course.cover}
            alt=""
            fill
            sizes="(max-width: 580px) 100vw, (max-width: 1080px) 48vw, 28vw"
          />
          <span className={styles.courseCategory}>{subject.name}</span>
          {course.free && <span className={styles.free}>Free</span>}
          {course.status === "completed" && (
            <span className={styles.completed}><CatalogIcon name="check" size={13} /> Completed</span>
          )}
        </div>
        <div className={styles.courseBody}>
          <p className={styles.rating}>
            <span className={styles.stars} aria-hidden="true">★★★★★</span>
            <span><span className="sr-only">Rated </span>{course.rating.toFixed(1)} <span className="sr-only">out of 5, </span>({course.reviews})</span>
          </p>
          <h2>{course.title}</h2>
          <p className={styles.courseDescription}>{course.description}</p>
          {course.status === "in-progress" && (
            <div className={styles.progress}>
              <span>In progress</span>
              <span className={styles.progressTrack} aria-hidden="true"><span /></span>
            </div>
          )}
          <ul className={styles.courseMeta} aria-label="Course information">
            <li><CatalogIcon name="book" size={14} />{course.lessonCount} lesson{course.lessonCount === 1 ? "" : "s"}</li>
            <li><CatalogIcon name="clock" size={14} />{course.duration}</li>
          </ul>
        </div>
      </Link>
    </article>
  );
}

export function CourseBrowser({
  subjects,
  subject,
  courses,
}: {
  subjects: readonly Subject[];
  subject: Subject;
  courses: readonly Course[];
}) {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("all");
  const [sort, setSort] = useState("newest");
  const [view, setView] = useState("grid");
  const normalized = query.trim().toLowerCase();

  const filtered = courses.filter((course) =>
    `${course.title} ${course.description}`.toLowerCase().includes(normalized) &&
    (status === "all" || course.status === status),
  );
  if (sort === "rating") filtered.sort((first, second) => second.rating - first.rating);
  if (sort === "title") filtered.sort((first, second) => first.title.localeCompare(second.title));

  return (
    <CatalogFrame
      subjects={subjects}
      activeSlug={subject.slug}
      search={<SearchField value={query} onChange={setQuery} label="Search courses" placeholder="Search courses..." />}
    >
      <section className={styles.courses} aria-labelledby="courses-heading">
        <h2 id="courses-heading" className={styles.courseHeading}>{subject.name} Courses</h2>
        <div className={styles.courseToolbar}>
          <div className={styles.filterGroup}>
            <p className={styles.results} role="status"><strong>{filtered.length}</strong> {filtered.length === 1 ? "course" : "courses"} found</p>
            <label className={styles.selectField}>
              <span>Status:</span>
              <select value={status} onChange={(event) => setStatus(event.target.value)}>
                <option value="all">All</option>
                <option value="new">New</option>
                <option value="in-progress">In progress</option>
                <option value="completed">Completed</option>
              </select>
            </label>
          </div>
          <div className={styles.filterGroup}>
            <label className={styles.selectField}>
              <span>Sort by:</span>
              <select value={sort} onChange={(event) => setSort(event.target.value)}>
                <option value="newest">Newest</option>
                <option value="rating">Highest rated</option>
                <option value="title">Title A–Z</option>
              </select>
            </label>
            <div className={styles.viewControls} aria-label="Course view">
              <button type="button" aria-label="Grid view" aria-pressed={view === "grid"} onClick={() => setView("grid")}>
                <CatalogIcon name="grid" size={17} />
              </button>
              <button type="button" aria-label="List view" aria-pressed={view === "list"} onClick={() => setView("list")}>
                <CatalogIcon name="list" size={17} />
              </button>
            </div>
          </div>
        </div>
        {filtered.length ? (
          <div className={`${styles.courseGrid} ${view === "list" ? styles.courseList : ""}`}>
            {filtered.map((course) => <CourseCard key={course.slug} course={course} subject={subject} />)}
          </div>
        ) : (
          <EmptyState
            message={courses.length ? "No courses match your search and filters." : "Courses for this subject are coming soon."}
            onReset={courses.length ? () => { setQuery(""); setStatus("all"); } : undefined}
          />
        )}
      </section>
    </CatalogFrame>
  );
}
