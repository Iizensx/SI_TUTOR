import Link from "next/link";
import type { Metadata } from "next";

import { connection } from "next/server";

import { formatCoursePrice, subjects } from "@/lib/catalog";
import { getPublicCourses } from "@/lib/server/catalog-store";
import { plans } from "@/lib/plans";
import { PricingPlans } from "./pricing-plans";
import styles from "./pricing.module.css";

export const metadata: Metadata = { title: "Pricing | SI Tutor" };

export default async function PricingPage() {
  await connection();
  const courses = await getPublicCourses();
  return (
    <main id="main-content" tabIndex={-1} className={styles.page}>
      <div className={styles.glow} aria-hidden="true" />
      <div className={styles.inner}>
        <PricingPlans plans={plans} />
        <p className={styles.demoNote}>Example prices · Demo checkout — no money is charged.</p>

        <section className={styles.courses} aria-labelledby="course-prices">
          <h2 id="course-prices">Single course prices</h2>
          <p>Prefer to buy one course at a time? Here is every course and its price.</p>
          <div className={styles.courseGrid}>
            {subjects.map((subject) => (
              <details key={subject.slug} className={styles.subject} style={{ ["--tone" as string]: subject.color }}>
                <summary>
                  {subject.name}
                  <span>{courses.filter((course) => course.subjectSlug === subject.slug).length} courses</span>
                </summary>
                <ul>
                  {courses.filter((course) => course.subjectSlug === subject.slug).map((course) => (
                    <li key={course.slug}>
                      <Link href={`/courses/${course.slug}`}>
                        <span>{course.title}</span>
                        <strong>{formatCoursePrice(course.price)}</strong>
                      </Link>
                    </li>
                  ))}
                </ul>
              </details>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
