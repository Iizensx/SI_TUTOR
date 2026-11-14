import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

import { courses, subjects } from "@/lib/catalog";

import styles from "./about.module.css";

export const metadata: Metadata = {
  title: "About | SI Tutor",
  description: "Learn about SI Tutor, our mission and the tools we are building for independent learners.",
};

const stats = [
  { value: subjects.length, label: "Subject categories" },
  { value: courses.length, label: "Demo courses" },
  { value: courses.reduce((total, course) => total + course.lessonCount, 0), label: "Sample lessons" },
  { value: 3, label: "Months of access" },
];

const features = [
  {
    icon: "books",
    title: "All subjects in one place",
    description: "Explore HSC, IELTS, robotics, university mathematics and Australian citizenship.",
  },
  {
    icon: "clock",
    title: "Learn at your own pace",
    description: "Choose a lesson, read the preview and work through each topic on your schedule.",
  },
  {
    icon: "chart",
    title: "Track your progress",
    description: "Mark lessons complete and keep your progress and notes in this browser.",
  },
  {
    icon: "trophy",
    title: "Study files included",
    description: "Download study notes to revisit the key ideas from each lesson.",
  },
] as const;

type IconName = (typeof features)[number]["icon"] | "target" | "vision" | "globe" | "chip" | "calculator";

const iconPaths: Record<IconName, string> = {
  books: "m3 6 9-4 9 4-9 4-9-4Zm0 5 9 4 9-4M3 16l9 4 9-4",
  clock: "M12 7v5l3 2m6-2a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z",
  chart: "M3 19h18M6 15v-2m4 2v-4m4 4V8m4 7V5M6 10l5-3 3 1 4-4",
  trophy: "M8 21h8m-4-5v5M7 4h10v6a5 5 0 0 1-10 0V4Zm0 2H4v2a3 3 0 0 0 3 3m10-5h3v2a3 3 0 0 1-3 3",
  target: "M12 12h.01m4 0a4 4 0 1 1-8 0 4 4 0 0 1 8 0Zm5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z",
  vision: "M2 12s3.6-6 10-6 10 6 10 6-3.6 6-10 6S2 12 2 12Zm13 0a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z",
  globe: "M3 12h18m0 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9-9c4 4 4 14 0 18-4-4-4-14 0-18Z",
  chip: "M8 3v3m4-3v3m4-3v3M8 18v3m4-3v3m4-3v3M3 8h3m-3 4h3m-3 4h3m12-8h3m-3 4h3m-3 4h3M6 6h12v12H6V6Zm3 3h6v6H9V9Z",
  calculator: "M7 3h10a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Zm1 4h8m-8 4h.01m4 0h.01m4 0h.01m-8 4h.01m4 0h.01m4 0h.01",
};

function Icon({ name }: { name: IconName }) {
  return (
    <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={iconPaths[name]} />
    </svg>
  );
}

export default function AboutPage() {
  return (
    <>
      <main id="main-content" tabIndex={-1} className={styles.page}>
        <section className={styles.hero} aria-labelledby="about-title">
          <div className={styles.heroCopy}>
            <h1 id="about-title">
              Learning made <em>simple</em>, for everyone
            </h1>
            <p lang="th">
              SI Tutor รวมบทเรียนหลากหลายวิชาไว้ในที่เดียว ให้คุณเลือกหัวข้อที่สนใจ
              เรียนตามจังหวะของตัวเอง และติดตามความก้าวหน้าได้
            </p>
            <div className={styles.actions}>
              <Link className={styles.primary} href="/subjects">
                Browse Subjects <span aria-hidden="true">→</span>
              </Link>
              <Link className={styles.secondary} href="/pricing">View Pricing</Link>
            </div>
          </div>
          <div className={styles.art}>
            <Image
              className={styles.logo}
              src="/about/si-tutor-logo.jpg"
              alt="SI Tutor robot mascot surrounded by books and study icons"
              width={1254}
              height={1254}
              sizes="(max-width: 650px) 176px, 250px"
              preload
            />
            <span className={styles.globe}><Icon name="globe" /></span>
            <span className={styles.chip}><Icon name="chip" /></span>
            <span className={styles.calculator}><Icon name="calculator" /></span>
          </div>
        </section>

        <dl className={styles.stats} aria-label="SI Tutor at a glance">
          {stats.map(({ label, value }) => (
            <div key={label}>
              <dt>{label}</dt>
              <dd>{value}</dd>
            </div>
          ))}
        </dl>

        <div className={styles.purpose}>
          <section className={styles.mission} aria-labelledby="mission-title">
            <span className={styles.purposeIcon}><Icon name="target" /></span>
            <h2 id="mission-title">Our Mission</h2>
            <p>Make quality learning easier to access. SI Tutor brings courses, lesson notes and progress tracking together so students can focus on what they want to learn.</p>
          </section>
          <section className={styles.vision} aria-labelledby="vision-title">
            <span className={styles.purposeIcon}><Icon name="vision" /></span>
            <h2 id="vision-title">Our Vision</h2>
            <p>Build a learning platform where students can explore new subjects, practise what they know and see how far they have come, from exam preparation to robotics.</p>
          </section>
        </div>

        <section className={styles.features} aria-labelledby="features-title">
          <h2 id="features-title">Why choose SI Tutor?</h2>
          <ul>
            {features.map(({ icon, title, description }) => (
              <li key={icon} className={styles.featureCard}>
                <span className={styles.featureIcon} data-icon={icon}><Icon name={icon} /></span>
                <h3>{title}</h3>
                <p>{description}</p>
              </li>
            ))}
          </ul>
        </section>
      </main>

      <footer className={styles.footer}>
        <div className={styles.footerContent}>
          <div className={styles.footerIdentity}>
            <Link className={styles.footerBrand} href="/" aria-label="SI Tutor home">
              <span><Icon name="books" /></span> SI Tutor
            </Link>
            <p>Explore courses, learn at your own pace and keep track of what you have learned.</p>
          </div>
          <nav className={styles.footerNav} aria-label="Quick links">
            <h2>Quick links</h2>
            <Link href="/">Home</Link>
            <Link href="/subjects">Subjects</Link>
            <Link href="/pricing">Pricing</Link>
            <Link href="/about" aria-current="page">About</Link>
          </nav>
          <nav className={styles.footerNav} aria-label="Explore SI Tutor">
            <h2>Explore</h2>
            <Link href="/subjects/robotics">SI &amp; Robotics</Link>
            <Link href="/subjects/ielts">IELTS</Link>
            <Link href="/courses/introduction-to-ai-and-ml">Featured course</Link>
          </nav>
          <div className={styles.footerBase}>© SI Tutor</div>
        </div>
      </footer>
    </>
  );
}

