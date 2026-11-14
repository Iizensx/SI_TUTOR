"use client";

import Image from "next/image";
import Link from "next/link";
import { useRef, useState, type ReactNode } from "react";

import { CatalogIcon } from "@/components/catalog-shell";
import { formatCoursePrice, type Course, type Subject } from "@/lib/catalog";

import { ContinueCourses } from "./continue-courses";
import styles from "./catalog.module.css";

const subjectStyles: Record<string, string> = {
  hsc: styles.hsc,
  ielts: styles.ielts,
  robotics: styles.robotics,
  mathematics: styles.mathematics,
  citizenship: styles.citizenship,
};

function getDissolveGlow(input: HTMLInputElement) {
  const context = document.createElement("canvas").getContext("2d");
  if (!context) return "";

  const style = getComputedStyle(input);
  context.font = style.font || `${style.fontSize} ${style.fontFamily}`;
  const spread = Number.parseFloat(style.getPropertyValue("--glow-spread")) || 1.5;
  const gradients: string[] = [];
  let x = -input.scrollLeft;

  for (const segment of input.value.split(/(\s+)/)) {
    const width = context.measureText(segment).width;
    if (x > input.clientWidth) break;

    if (segment.trim() && x + width > 0) {
      const center = x + width / 2;
      const radius = Math.max(width * .45, 8) * spread;
      for (const [offset, scale, height, opacity] of [[0, .8, 7, .22], [.45, .55, 8, .18], [-.4, .65, 6, .16]]) {
        gradients.push(`radial-gradient(ellipse ${radius * scale}px ${height}px at ${center + radius * offset}px 100%, rgb(0 0 0 / ${opacity}), transparent)`);
      }
    }
    x += width;
  }
  return gradients.join(", ");
}

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
  const inputRef = useRef<HTMLInputElement>(null);
  const [dissolve, setDissolve] = useState<{ text: string; offset: number; glow: string } | null>(null);
  const clearing = dissolve !== null && value === "";

  function clearSearch() {
    const input = inputRef.current;
    if (!input || !value) return;

    setDissolve(window.matchMedia("(prefers-reduced-motion: reduce)").matches
      ? null
      : { text: value, offset: input.scrollLeft, glow: getDissolveGlow(input) });
    onChange("");
    input.focus({ preventScroll: true });
  }

  return (
    <div className={styles.search}>
      <span className={styles.searchIcon} aria-hidden="true"><CatalogIcon name="search" size={17} /></span>
      <div className={styles["t-clear"]} data-clearing={clearing || undefined}>
        <input
          ref={inputRef}
          aria-label={label}
          type="search"
          placeholder={placeholder}
          value={value}
          onChange={(event) => {
            setDissolve(null);
            onChange(event.target.value);
          }}
          onKeyDown={(event) => {
            if (event.key === "Escape" && value && !event.nativeEvent.isComposing) {
              event.preventDefault();
              clearSearch();
            }
          }}
        />
        {clearing && (
          <>
            <span className={styles["t-clear-mirror"]} aria-hidden="true">
              <span style={{ marginLeft: -dissolve.offset }}>
                {dissolve.text}
              </span>
            </span>
            <span
              className={styles["t-clear-placeholder"]}
              aria-hidden="true"

            >
              {placeholder}
            </span>
            <span
              className={styles["t-clear-glow"]}
              aria-hidden="true"
              style={{ backgroundImage: dissolve.glow }}
              onAnimationEnd={() => setDissolve(null)}
            />
          </>
        )}
      </div>
      {value && (
        <button
          type="button"
          className={styles["t-clear-btn"]}
          aria-label="Clear search"
          onPointerDown={(event) => {
            if (document.activeElement === inputRef.current) event.preventDefault();
          }}
          onClick={clearSearch}
        >
          <span>Clear</span><span aria-hidden="true">×</span>
        </button>
      )}
    </div>
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
      <p className={styles.sidebarTitle}>Categories</p>
      <ul>
        {links.map(({ label, href, icon, active }) => (
          <li key={href}>
            <Link href={href} scroll={false} aria-current={active ? "page" : undefined} className={subjectStyles[icon]}>
              <span className={styles.sidebarIcon}>
                <CatalogIcon name={icon} size={20} />
              </span>
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
      <div className={styles.catalogLayout}>
        <div className={styles.catalogMain}>
          <section className={styles.catalogBanner} aria-labelledby="catalog-banner-title">
            <Image
              className={styles.bannerImage}
              src="/home/hero.jpg"
              alt=""
              fill
              sizes="(max-width: 1100px) 100vw, 75vw"
            />
            <div className={styles.bannerCopy}>
              <h2 id="catalog-banner-title">Learn at your own pace</h2>
              <p>Buy a course once and access its lessons and study files for 3 months.</p>
            </div>
          </section>
          <div className={styles.browserLayout}>
            <Sidebar subjects={subjects} activeSlug={activeSlug} />
            {children}
          </div>
        </div>
        <ContinueCourses />
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
                  <Image src={subject.image} alt="" width={180} height={155} sizes="(max-width: 490px) 90px, 140px" />
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
        </div>
        <div className={styles.courseBody}>
          <h2>{course.title}</h2>
          <p className={styles.courseDescription}>{course.description}</p>
          <ul className={styles.courseMeta} aria-label="Course information">
            <li><CatalogIcon name="book" size={14} />{course.lessonCount} lesson{course.lessonCount === 1 ? "" : "s"}</li>
            <li><CatalogIcon name="clock" size={14} />{course.duration}</li>
          </ul>
          <p className="mt-2 text-sm text-slate-700">{course.lessonCount} study {course.lessonCount === 1 ? "file" : "files"} · 3 months of access</p>
          <p className="mt-2 flex flex-wrap items-center justify-between gap-2 text-sm font-bold text-blue-800">
            <span>{formatCoursePrice(course.price)}</span><span>View Details →</span>
          </p>
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
  const [sort, setSort] = useState("newest");
  const [view, setView] = useState("grid");
  const normalized = query.trim().toLowerCase();

  const filtered = courses.filter((course) =>
    `${course.title} ${course.description}`.toLowerCase().includes(normalized),
  );
  if (sort === "price") filtered.sort((first, second) => first.price - second.price);
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
          </div>
          <div className={styles.filterGroup}>
            <label className={styles.selectField}>
              <span>Sort by:</span>
              <select value={sort} onChange={(event) => setSort(event.target.value)}>
                <option value="newest">Newest</option>
                <option value="price">Lowest price</option>
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
          <div key={subject.slug} className={`${styles.courseGrid} ${view === "list" ? styles.courseList : ""}`}>
            {filtered.map((course) => <CourseCard key={course.slug} course={course} subject={subject} />)}
          </div>
        ) : (
          <EmptyState
            message={courses.length ? "No courses match your search." : "Courses for this subject are coming soon."}
            onReset={courses.length ? () => setQuery("") : undefined}
          />
        )}
      </section>
    </CatalogFrame>
  );
}
