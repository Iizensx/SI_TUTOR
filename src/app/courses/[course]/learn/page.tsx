import Link from "next/link";
import { notFound } from "next/navigation";
import { CourseIcon } from "@/components/course-shared";
import { LearningRoom } from "@/components/course-learning";
import { getCourse, getSubject } from "@/lib/catalog";
import styles from "@/components/course-experience.module.css";

export default async function LearnPage({
  params,
  searchParams,
}: {
  params: Promise<{ course: string }>;
  searchParams: Promise<{ preview?: string | string[] }>;
}) {
  const { course: slug } = await params;
  const { preview } = await searchParams;
  const course = getCourse(slug);
  if (!course) notFound();

  const subject = getSubject(course.subjectSlug);
  if (!subject) notFound();

  return (
    <div className={styles.shell}>
      <main id="main-content" tabIndex={-1} className={styles.main}>
        <Link className={styles.backLink} href={`/courses/${course.slug}`}><CourseIcon name="back" /> Back to Course</Link>
        <LearningRoom course={course} subject={subject} preview={preview === "1"} />
      </main>
    </div>
  );
}

