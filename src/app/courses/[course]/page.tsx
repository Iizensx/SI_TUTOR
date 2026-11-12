import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Breadcrumbs } from "@/components/catalog-shell";
import { CourseHero, CourseIcon, Curriculum } from "@/components/course-shared";
import { courses, getCourse, getCoursesBySubject, getSubject } from "@/lib/catalog";
import styles from "@/components/course-experience.module.css";

export function generateStaticParams() {
  return courses.map(({ slug }) => ({ course: slug }));
}

export default async function CourseDetail({ params }: { params: Promise<{ course: string }> }) {
  const { course: slug } = await params;
  const course = getCourse(slug);
  if (!course) notFound();

  const subject = getSubject(course.subjectSlug);
  if (!subject) notFound();

  const learnHref = `/courses/${course.slug}/learn`;
  const related = getCoursesBySubject(subject.slug).filter(({ slug }) => slug !== course.slug).slice(0, 3);

  return (
    <div className={styles.shell}>
      <main id="main-content" tabIndex={-1} className={styles.main}>
        <Breadcrumbs items={[
          { label: "Home", href: "/" },
          { label: "Subjects", href: "/subjects" },
          { label: subject.name, href: `/subjects/${subject.slug}` },
          { label: course.title },
        ]} />
        <div className={styles.detailGrid}>
          <CourseHero course={course} subject={subject}>
            <Link className={styles.previewButton} href={`${learnHref}?preview=1`}>
              <CourseIcon name="play" /> View Preview
            </Link>
          </CourseHero>

          <aside className={styles.sidebar} aria-label="Enrollment and instructor">
            <section className={styles.enrollCard}>
              <div className={styles.enrollTitle}>
                <h2>{course.free ? "Free" : "Course access"}</h2>
                <span>Demo</span>
              </div>
              <Link className={styles.primaryButton} href={learnHref}>
                {course.free ? "Enroll Now – It’s Free" : "Open Demo Course"} <CourseIcon name="arrow" />
              </Link>
              <h3>This course includes</h3>
              <ul className={styles.includes}>
                <li><CourseIcon name="book" /> {course.lessonCount} lesson{course.lessonCount === 1 ? "" : "s"}</li>
                <li><CourseIcon name="clock" /> {course.duration} of content</li>
                <li><CourseIcon name="check" /> Lesson notes and progress</li>
              </ul>
              <p className={styles.enrollNote}>Demo access opens the classroom. Your progress is saved in this browser.</p>
            </section>

            <section className={styles.instructor}>
              <h2>Instructor</h2>
              <div className={styles.instructorRow}>
                <span className={styles.avatar} aria-hidden="true">{course.instructor.split(" ").slice(-2).map((part) => part[0]).join("")}</span>
                <div><strong>{course.instructor}</strong><span>{subject.name}</span></div>
              </div>
            </section>
          </aside>

          <div className={styles.detailContent}>
            <nav className={styles.sectionNav} aria-label="Course sections">
              <a href="#overview">Overview</a>
              <a href="#curriculum">Curriculum</a>
              {related.length > 0 && <a href="#related-courses">Related Courses</a>}
            </nav>

            <section id="overview" className={styles.contentSection}>
              <h2>About Course</h2>
              <p>{course.description}</p>
              <div className={styles.outcomes}>
                <h3>What You’ll Learn</h3>
                <ul>
                  {course.outcomes.map((outcome) => <li key={outcome}><CourseIcon name="check" /> {outcome}</li>)}
                </ul>
              </div>
            </section>

            <section id="curriculum" className={styles.contentSection}>
              <h2>Curriculum</h2>
              <Curriculum course={course} />
            </section>

            {related.length > 0 && (
              <section id="related-courses" className={styles.contentSection}>
                <h2>Related Courses</h2>
                <div className={styles.relatedGrid}>
                  {related.map((item) => (
                    <Link key={item.slug} className={styles.relatedCard} href={`/courses/${item.slug}`}>
                      <Image src={item.cover} alt="" width={360} height={180} sizes="(max-width: 500px) 45vw, 230px" />
                      <div><h3>{item.title}</h3><p><span aria-hidden="true">★</span> {item.rating.toFixed(1)} · {item.lessonCount} lesson{item.lessonCount === 1 ? "" : "s"}</p></div>
                    </Link>
                  ))}
                </div>
              </section>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

