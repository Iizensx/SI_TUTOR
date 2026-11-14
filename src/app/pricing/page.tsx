import Link from "next/link";
import type { Metadata } from "next";

import { courses, formatCoursePrice, subjects } from "@/lib/catalog";

export const metadata: Metadata = { title: "Pricing | SI Tutor" };

export default function PricingPage() {
  return (
    <main id="main-content" tabIndex={-1} className="mx-auto w-full max-w-5xl px-4 py-10 sm:py-16">
      <div className="mb-8 text-center">
        <h1 className="text-4xl font-extrabold tracking-tight">Subject Pricing</h1>
        <p className="mx-auto mt-3 max-w-xl text-slate-600">Pay once for each subject. Get three months of access to its lessons and study files.</p>
        <p className="mt-3 text-sm font-medium text-blue-800">Example prices · Demo checkout</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        {subjects.map((subject) => (
          <section key={subject.slug} className="rounded-2xl border border-blue-100 bg-white p-5">
            <h2 className="mb-3 text-lg font-bold">{subject.name}</h2>
            <ul className="divide-y divide-slate-100">
              {courses.filter((course) => course.subjectSlug === subject.slug).map((course) => (
                <li key={course.slug}>
                  <Link href={`/courses/${course.slug}`} className="flex flex-wrap justify-between gap-2 py-3 text-sm hover:text-blue-800">
                    <span>{course.title}</span><strong>{formatCoursePrice(course.price)}</strong>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </main>
  );
}
