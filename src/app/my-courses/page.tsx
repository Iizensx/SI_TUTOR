import { DemoLibrary } from "@/components/course-access";
import { courses } from "@/lib/catalog";

export default function MyCoursesPage() {
  return (
    <main id="main-content" tabIndex={-1} className="mx-auto w-full max-w-2xl px-4 py-8 sm:py-14">
      <section className="rounded-2xl border border-blue-100 bg-white p-5 sm:p-8">
        <h1 className="text-3xl font-extrabold">My Courses</h1>
        <DemoLibrary courses={courses.map(({ slug, title }) => ({ slug, title }))} />
      </section>
    </main>
  );
}
