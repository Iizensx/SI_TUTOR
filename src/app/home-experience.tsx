"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef } from "react";
import { MotionConfig, animate, motion, useInView, useMotionValue, useScroll, useTransform } from "framer-motion";

import type { Course, Subject } from "@/lib/catalog";
import { formatCoursePrice } from "@/lib/catalog";
import styles from "./home.module.css";

const ease = [0.22, 1, 0.36, 1] as const;

function Arrow({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M5 12h14m-6-6 6 6-6 6" />
    </svg>
  );
}

function CountUp({ value, suffix = "" }: { value: number; suffix?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true });
  const motionValue = useMotionValue(0);
  const rounded = useTransform(motionValue, (latest) => `${Math.round(latest)}${suffix}`);
  useEffect(() => {
    if (!inView) return;
    const controls = animate(motionValue, value, { duration: 1.4, ease });
    return () => controls.stop();
  }, [inView, value, motionValue]);
  return <span ref={ref} aria-label={`${value}${suffix}`}><motion.span aria-hidden="true">{rounded}</motion.span></span>;
}

/* ─────────── Hero ─────────── */

function Hero({ courseCount }: { courseCount: number }) {
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const imageY = useTransform(scrollYProgress, [0, 1], [0, 60]);

  return (
    <section ref={ref} className={styles.hero} aria-labelledby="home-title">
      <div className={styles.heroCopy}>
        <motion.p className={styles.badge} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease }}>
          <i aria-hidden="true" /> AI-powered learning · {courseCount} courses
        </motion.p>
        <h1 id="home-title" className={styles.title}>
          {["Learn smarter", "with your own", "SI tutor."].map((line, index) => (
            <span key={line} className={styles.line}>
              <motion.span
                className={index === 2 ? styles.highlight : undefined}
                initial={{ y: "110%" }}
                animate={{ y: 0 }}
                transition={{ duration: 0.9, ease, delay: 0.1 + index * 0.1 }}
              >
                {line}
              </motion.span>
            </span>
          ))}
        </h1>
        <motion.p className={styles.lead} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, ease, delay: 0.4 }}>
          HSC, IELTS, AI &amp; Robotics, University Maths and Australian Citizenship — clear lessons, study files and progress tracking in one place.
        </motion.p>
        <motion.div className={styles.ctas} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, ease, delay: 0.5 }}>
          <Link href="/subjects" className={styles.primary}>
            Explore subjects <span className={styles.ctaArrow}><Arrow /></span>
          </Link>
          <Link href="/pricing" className={styles.secondary}>View pricing</Link>
        </motion.div>
        <motion.div className={styles.trust} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.7, delay: 0.7 }}>
          <span className={styles.avatars} aria-hidden="true">
            {["blue", "violet", "green", "amber"].map((color) => (
              <Image key={color} src={`/account-avatars/${color}.png`} alt="" width={34} height={34} />
            ))}
          </span>
          <span>Learn at your own pace · <strong>3 months</strong> access per course</span>
        </motion.div>
      </div>

      <motion.div className={styles.heroVisual} initial={{ opacity: 0, scale: 0.94 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 1, ease, delay: 0.15 }}>
        <motion.div className={styles.heroFrame} style={{ y: imageY }} aria-hidden="true" />

        <div className={styles.subjectPopouts} aria-hidden="true">
          <Image src="/home/subject-panels/hsc.png" alt="" width={1600} height={900} className={`${styles.subjectPanel} ${styles.subjectHsc}`} />
          <Image src="/home/subject-panels/ielts.png" alt="" width={1600} height={900} className={`${styles.subjectPanel} ${styles.subjectIelts}`} />
          <Image src="/home/subject-panels/robotics.png" alt="" width={1600} height={900} className={`${styles.subjectPanel} ${styles.subjectRobotics}`} />
          <Image src="/home/subject-panels/mathematics.png" alt="" width={1600} height={900} className={`${styles.subjectPanel} ${styles.subjectMaths}`} />
          <Image src="/home/subject-panels/citizenship.png" alt="" width={1600} height={900} className={`${styles.subjectPanel} ${styles.subjectCitizenship}`} />
        </div>
        <div className={styles.heroPopout} aria-hidden="true">
          <Image src="/home/hero-robot-popout.png" alt="" fill sizes="(max-width: 960px) 55vw, 400px" className={styles.heroPopoutImage} />
        </div>


      </motion.div>
    </section>
  );
}

/* ─────────── Stats ─────────── */

function Stats({ subjectCount, courseCount }: { subjectCount: number; courseCount: number }) {
  const items = [
    { value: subjectCount, suffix: "", label: "Subject areas" },
    { value: courseCount, suffix: "+", label: "Courses to explore" },
    { value: 3, suffix: " mo", label: "Access per course" },
    { value: 24, suffix: "/7", label: "AI help, any time" },
  ];
  return (
    <section className={styles.stats} aria-label="SI Tutor at a glance">
      {items.map((item, index) => (
        <motion.div
          key={item.label}
          className={styles.stat}
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.6 }}
          transition={{ duration: 0.6, ease, delay: index * 0.08 }}
        >
          <strong><CountUp value={item.value} suffix={item.suffix} /></strong>
          <span>{item.label}</span>
        </motion.div>
      ))}
    </section>
  );
}

/* ─────────── Categories ─────────── */

function Categories({ subjects, counts }: { subjects: readonly Subject[]; counts: Record<string, number> }) {
  return (
    <section className={styles.section} id="subjects" aria-labelledby="subjects-title">
      <motion.div className={styles.sectionHead} initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.7, ease }}>
        <p className={styles.eyebrow}>CATEGORIES</p>
        <h2 id="subjects-title">Choose a <span className={styles.highlight}>Category</span></h2>
        <p>Explore the subjects you can learn with SI Tutor.</p>
      </motion.div>

      <ul className={styles.categoryGrid}>
        {subjects.map((subject, index) => (
          <motion.li
            key={subject.slug}
            className={styles.categoryItem}
            data-slug={subject.slug}
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.7, ease, delay: index * 0.08 }}
          >
            <Link href={`/subjects/${subject.slug}`} className={styles.categoryCard}>
              <span className={styles.categoryCount}>{counts[subject.slug] ?? 0} courses</span>
              <span className={styles.categoryArt}>
                <Image src={subject.image} alt="" width={280} height={180} sizes="(max-width: 640px) 60vw, 260px" />
              </span>
              <span className={styles.categoryName}>{subject.name}</span>
              <span className={styles.categoryText}>{subject.description}</span>
              <span className={styles.categoryArrow} aria-hidden="true"><Arrow size={20} /></span>
            </Link>
          </motion.li>
        ))}
      </ul>
    </section>
  );
}

/* ─────────── How it works ─────────── */

const steps = [
  { title: "Pick a subject", text: "Browse categories and choose a course that matches your goal.", tone: "#e0f2fe", icon: <><circle cx="11" cy="11" r="6" /><path d="m16 16 4 4" /></> },
  { title: "Learn with AI", text: "Short lessons, study files and an AI tutor that explains every step.", tone: "#ede9fe", icon: <><rect x="4" y="6" width="16" height="12" rx="3" /><path d="M9 11h.01M15 11h.01M10 15h4M12 3v3" /></> },
  { title: "Track progress", text: "See what you have mastered and jump back into your next lesson.", tone: "#ccfbf1", icon: <><path d="M4 19h16" /><path d="M7 15v-3M12 15V8M17 15v-6" /></> },
];

function HowItWorks() {
  return (
    <section className={styles.section} aria-labelledby="how-title">
      <motion.div className={styles.sectionHead} initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.7, ease }}>
        <p className={styles.eyebrow}>HOW IT WORKS</p>
        <h2 id="how-title">Three steps to a better study routine</h2>
      </motion.div>
      <ol className={styles.steps}>
        <motion.span
          className={styles.stepLine}
          aria-hidden="true"
          initial={{ scaleX: 0 }}
          whileInView={{ scaleX: 1 }}
          viewport={{ once: true, amount: 0.5 }}
          transition={{ duration: 1.2, ease, delay: 0.2 }}
        />
        {steps.map((step, index) => (
          <motion.li
            key={step.title}
            className={styles.step}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.4 }}
            transition={{ duration: 0.6, ease, delay: 0.15 + index * 0.15 }}
          >
            <span className={styles.stepIcon} style={{ background: step.tone }}>
              <svg viewBox="0 0 24 24" aria-hidden="true">{step.icon}</svg>
              <em>0{index + 1}</em>
            </span>
            <h3>{step.title}</h3>
            <p>{step.text}</p>
          </motion.li>
        ))}
      </ol>
    </section>
  );
}

/* ─────────── Popular courses ─────────── */

function PopularCourses({ courses, subjectNames }: { courses: readonly Course[]; subjectNames: Record<string, string> }) {
  return (
    <section className={styles.section} aria-labelledby="popular-title">
      <motion.div className={`${styles.sectionHead} ${styles.sectionHeadRow}`} initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.7, ease }}>
        <div>
          <p className={styles.eyebrow}>POPULAR</p>
          <h2 id="popular-title">Learners’ favourite courses</h2>
        </div>
        <Link href="/subjects" className={styles.textLink}>See all subjects <Arrow size={15} /></Link>
      </motion.div>
      <div className={styles.courseRow}>
        {courses.map((course, index) => (
          <motion.article
            key={course.slug}
            className={styles.courseCard}
            initial={{ opacity: 0, y: 36 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.6, ease, delay: index * 0.08 }}
          >
            <Link href={`/courses/${course.slug}`}>
              <span className={styles.courseMedia}>
                <Image src={course.cover} alt="" fill sizes="(max-width: 640px) 80vw, 300px" />
                <span className={styles.courseTag}>{subjectNames[course.subjectSlug]}</span>
              </span>
              <span className={styles.courseBody}>
                <span className={styles.courseRating}>
                  <span aria-hidden="true">★</span> {course.rating.toFixed(1)} <small>({course.reviews})</small>
                  <span className="sr-only"> out of 5</span>
                </span>
                <strong>{course.title}</strong>
                <span className={styles.courseFoot}>
                  <span>{formatCoursePrice(course.price)}</span>
                  <span className={styles.courseGo} aria-hidden="true"><Arrow size={14} /></span>
                </span>
              </span>
            </Link>
          </motion.article>
        ))}
      </div>
    </section>
  );
}

/* ─────────── CTA band & footer ─────────── */

function CtaBand() {
  return (
    <motion.section
      className={styles.cta}
      aria-labelledby="cta-title"
      initial={{ opacity: 0, y: 40, scale: 0.98 }}
      whileInView={{ opacity: 1, y: 0, scale: 1 }}
      viewport={{ once: true, amount: 0.3 }}
      transition={{ duration: 0.8, ease }}
    >
      <span className={styles.ctaGlow} aria-hidden="true" />
      <div>
        <p className={styles.ctaTag}>Save 20% • 3-Course Bundle</p>
        <h2 id="cta-title">Three courses. One price. <span>$69.</span></h2>
        <p>Mix any 3 courses across categories — or unlock everything with the All-Access Pass.</p>
      </div>
      <div className={styles.ctaButtons}>
        <Link href="/pricing" className={styles.primary}>See plans <span className={styles.ctaArrow}><Arrow /></span></Link>
        <Link href="/signup" className={styles.ghostLight}>Create free account</Link>
      </div>
    </motion.section>
  );
}

function Footer() {
  return (
    <footer className={styles.footer}>
      <Link href="/" className={styles.footerBrand} aria-label="SI Tutor home">
        <Image src="/catalog/brand-robot.jpg" alt="" width={40} height={40} />
        <span><strong><span>SI</span> TUTOR</strong><small>Super Intelligence Tutor · Learn Beyond Limits.</small></span>
      </Link>
      <nav aria-label="Footer navigation">
        <Link href="/subjects">Subjects</Link>
        <Link href="/pricing">Pricing</Link>
        <Link href="/about">About</Link>
        <Link href="/my-courses">My Courses</Link>
      </nav>
      <p>© 2026 SI Tutor. All rights reserved.</p>
    </footer>
  );
}

export function HomeExperience({
  subjects,
  counts,
  courseCount,
  popular,
}: {
  subjects: readonly Subject[];
  counts: Record<string, number>;
  courseCount: number;
  popular: readonly Course[];
}) {
  const subjectNames = Object.fromEntries(subjects.map((subject) => [subject.slug, subject.name]));
  return (
    <MotionConfig reducedMotion="user">
      <div className={styles.page} id="home">
        <div className={styles.glow} aria-hidden="true" />
        <main id="main-content" tabIndex={-1} className={styles.inner}>
          <Hero courseCount={courseCount} />
          <Stats subjectCount={subjects.length} courseCount={courseCount} />
          <Categories subjects={subjects} counts={counts} />
          <HowItWorks />
          <PopularCourses courses={popular} subjectNames={subjectNames} />
          <CtaBand />
        </main>
        <div className={styles.inner}><Footer /></div>
      </div>
    </MotionConfig>
  );
}
