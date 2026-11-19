"use client";

import Image from "next/image";
import Link from "next/link";
import { useRef, useState, type ReactNode } from "react";
import { AnimatePresence, MotionConfig, motion } from "framer-motion";

import { CatalogIcon } from "@/components/catalog-shell";
import { formatCoursePrice, type Course, type Subject } from "@/lib/catalog";

import { ContinueCourses } from "./continue-courses";
import styles from "./catalog.module.css";

const ease = [0.22, 1, 0.36, 1] as const;
// Wide illustrated backgrounds prepared for each category (pastel on the left, scene on the right).
const subjectBackgrounds: Record<string, string> = {
  hsc: "/catalog/hsc-classroom-background.png",
  ielts: "/catalog/ielts-category-background.png",
  robotics: "/catalog/robotics-category-background.png",
  mathematics: "/catalog/mathematics-category-background.png",
  citizenship: "/catalog/citizenship-category-background.png",
};
const countIn = (catalog: readonly Course[], slug: string) => catalog.filter((course) => course.subjectSlug === slug).length;

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

function Sidebar({ subjects, catalog, activeSlug }: { subjects: readonly Subject[]; catalog: readonly Course[]; activeSlug?: string }) {
  const links = [
    { label: "All Subjects", href: "/subjects", icon: "all", active: !activeSlug, count: catalog.length },
    ...subjects.map((subject) => ({
      label: subject.name,
      href: `/subjects/${subject.slug}`,
      icon: subject.slug,
      active: subject.slug === activeSlug,
      count: countIn(catalog, subject.slug),
    })),
  ];

  return (
    <nav className={styles.sidebar} aria-label="Subject categories">
      <p className={styles.sidebarTitle}>Categories</p>
      <ul>
        {links.map(({ label, href, icon, active, count }) => (
          <li key={href}>
            <Link href={href} scroll={false} aria-current={active ? "page" : undefined} className={subjectStyles[icon]}>
              {active && <motion.span layoutId="sidebar-active" className={styles.sidebarActive} transition={{ type: "spring", stiffness: 400, damping: 34 }} />}
              <span className={styles.sidebarIcon}>
                <CatalogIcon name={icon} size={19} />
              </span>
              <span className={styles.sidebarLabel}>{label}</span>
              <span className={styles.sidebarCount}>{count}</span>
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
  catalog,
  activeSlug,
  title,
  subtitle,
  search,
  children,
}: {
  subjects: readonly Subject[];
  catalog: readonly Course[];
  activeSlug?: string;
  title: string;
  subtitle: string;
  search: ReactNode;
  children: ReactNode;
}) {
  return (
    <MotionConfig reducedMotion="user">
      <motion.header
        className={styles.subjectIntro}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease }}
      >
        <div>
          <p className={styles.eyebrow}>EXPLORE · {subjects.length} SUBJECTS · {catalog.length} COURSES</p>
          <h1>{title}</h1>
          <p>{subtitle}</p>
        </div>
        <div className={styles.subjectSearch}>{search}</div>
      </motion.header>
      <div className={styles.catalogLayout}>
        <div className={styles.catalogMain}>
          <motion.section
            className={styles.catalogBanner}
            aria-labelledby="catalog-banner-title"
            initial={{ opacity: 0, y: 24, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.8, ease, delay: 0.1 }}
          >
            <span className={styles.bannerGlow} aria-hidden="true" />
            <div className={styles.bannerCopy}>
              <span className={styles.bannerTag}>3 months access · every course</span>
              <h2 id="catalog-banner-title">Learn at your own pace</h2>
              <p>Buy a course once and keep its lessons and study files for 3 months — or save with a bundle.</p>
              <Link href="/pricing" className={styles.bannerCta}>
                View plans <CatalogIcon name="arrow" size={15} />
              </Link>
            </div>
            <motion.div
              className={styles.bannerArt}
              aria-hidden="true"
              animate={{ y: [0, -8, 0] }}
              transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
            >
              <Image src="/catalog/brand-robot.jpg" alt="" width={220} height={220} sizes="220px" />
            </motion.div>
          </motion.section>
          <div className={styles.browserLayout}>
            <Sidebar subjects={subjects} catalog={catalog} activeSlug={activeSlug} />
            {children}
          </div>
        </div>
        <ContinueCourses />
      </div>
    </MotionConfig>
  );
}

export function SubjectBrowser({ subjects, catalog }: { subjects: readonly Subject[]; catalog: readonly Course[] }) {
  const [query, setQuery] = useState("");
  const normalized = query.trim().toLowerCase();
  const matchingSubjects = subjects.filter(({ name, description }) =>
    `${name} ${description}`.toLowerCase().includes(normalized),
  );

  return (
    <CatalogFrame
      subjects={subjects}
      catalog={catalog}
      title="Subjects"
      subtitle="Explore every subject on SI Tutor and find the right course for your goal."
      search={<SearchField value={query} onChange={setQuery} label="Search subjects" placeholder="What would you like to learn today?" />}
    >
      {matchingSubjects.length > 0 ? (
        <ul className={styles.subjectGrid} aria-label="Subjects">
          <AnimatePresence mode="popLayout">
            {matchingSubjects.map((subject, index) => (
              <motion.li
                key={subject.slug}
                layout
                className={subjectStyles[subject.slug]}
                initial={{ opacity: 0, y: 28, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.55, ease, delay: 0.15 + index * 0.06 }}
              >
                <Link className={styles.subjectCard} href={`/subjects/${subject.slug}`}>
                  <Image
                    className={styles.subjectBg}
                    src={subjectBackgrounds[subject.slug] ?? subject.image}
                    alt=""
                    fill
                    sizes="(max-width: 640px) 100vw, (max-width: 1100px) 50vw, 520px"
                  />
                  <span className={styles.subjectShade} aria-hidden="true" />
                  <span className={styles.subjectText}>
                    <h2>{subject.name}</h2>
                    <p>{subject.description}</p>
                  </span>
                  <span className={styles.viewCourses}>
                    <i aria-hidden="true" />
                    View Courses <CatalogIcon name="arrow" size={15} />
                    <span className="sr-only"> ({countIn(catalog, subject.slug)} courses)</span>
                  </span>
                </Link>
              </motion.li>
            ))}
          </AnimatePresence>
        </ul>
      ) : (
        <EmptyState onReset={() => setQuery("")} message="No subjects match your search." />
      )}
    </CatalogFrame>
  );
}

function Stars({ rating }: { rating: number }) {
  return (
    <span className={styles.stars} aria-hidden="true">
      {[1, 2, 3, 4, 5].map((star) => (
        <svg key={star} viewBox="0 0 24 24" data-on={rating >= star - 0.25 || undefined}>
          <path d="m12 3 2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1-4.4-4.3 6.1-.9Z" />
        </svg>
      ))}
    </span>
  );
}

function CourseCard({ course, subject, index }: { course: Course; subject: Subject; index: number }) {
  return (
    <motion.article
      className={styles.courseCard}
      layout
      initial={{ opacity: 0, y: 26 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.96 }}
      transition={{ duration: 0.5, ease, delay: Math.min(index, 8) * 0.05 }}
    >
      <Link href={`/courses/${course.slug}`} className={styles.courseLink}>
        <div className={styles.courseMedia}>
          <Image
            src={course.cover}
            alt=""
            fill
            sizes="(max-width: 580px) 100vw, (max-width: 1080px) 48vw, 28vw"
          />
          <span className={styles.courseCategory}>{subject.name}</span>
          <span className={styles.coursePrice}>{formatCoursePrice(course.price).replace(" AUD", "")}</span>
        </div>
        <div className={styles.courseBody}>
          {course.rating > 0 ? (
            <p className={styles.rating}>
              <Stars rating={course.rating} />
              <strong>{course.rating.toFixed(1)}</strong>
              <span>({course.reviews} reviews)</span>
              <span className="sr-only">Rated {course.rating} out of 5</span>
            </p>
          ) : (
            <p className={styles.rating}><span className={styles.newBadge}>New course</span></p>
          )}
          <h2>{course.title}</h2>
          <p className={styles.courseDescription}>{course.description}</p>
          <ul className={styles.courseMeta} aria-label="Course information">
            <li><CatalogIcon name="book" size={14} />{course.lessonCount} lesson{course.lessonCount === 1 ? "" : "s"}</li>
            <li><CatalogIcon name="clock" size={14} />{course.duration}</li>
            <li><CatalogIcon name="check" size={14} />3 months access</li>
          </ul>
          <p className={styles.courseFooter}>
            <span>{formatCoursePrice(course.price)}</span>
            <span className={styles.details}>View details <CatalogIcon name="arrow" size={14} /></span>
          </p>
        </div>
      </Link>
    </motion.article>
  );
}

export function CourseBrowser({
  subjects,
  catalog,
  subject,
  courses,
}: {
  subjects: readonly Subject[];
  catalog: readonly Course[];
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
      catalog={catalog}
      activeSlug={subject.slug}
      title={subject.name}
      subtitle={subject.description}
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
              {(["grid", "list"] as const).map((mode) => (
                <button key={mode} type="button" aria-label={`${mode === "grid" ? "Grid" : "List"} view`} aria-pressed={view === mode} onClick={() => setView(mode)}>
                  {view === mode && <motion.span layoutId="view-toggle" className={styles.viewActive} transition={{ type: "spring", stiffness: 420, damping: 32 }} />}
                  <CatalogIcon name={mode} size={17} />
                </button>
              ))}
            </div>
          </div>
        </div>
        {filtered.length ? (
          <div key={subject.slug} className={`${styles.courseGrid} ${view === "list" ? styles.courseList : ""}`}>
            <AnimatePresence mode="popLayout">
              {filtered.map((course, index) => <CourseCard key={course.slug} course={course} subject={subject} index={index} />)}
            </AnimatePresence>
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
