import Link from "next/link";
import { notFound } from "next/navigation";
import { DemoCheckout } from "@/components/course-access";
import { getCourse } from "@/lib/catalog";

export default async function CheckoutPage({ params }: { params: Promise<{ course: string }> }) {
  const course = getCourse((await params).course);
  if (!course) notFound();
  return (
    <main id="main-content" tabIndex={-1} className="mx-auto w-full max-w-2xl px-4 py-8 sm:py-14">
      <section className="rounded-2xl border border-blue-100 bg-white p-5 sm:p-8">
        <Link className="text-sm font-semibold text-blue-800" href={`/courses/${course.slug}`}>← Back to subject</Link>
        <h1 className="mt-4 text-3xl font-extrabold">{course.title}</h1>
        <DemoCheckout course={course} />
      </section>
    </main>
  );
}
