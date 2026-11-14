import { DemoLogin } from "@/components/course-access";

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string | string[] }> }) {
  const { next } = await searchParams;
  const safeNext = typeof next === "string" && /^\/(?:subjects|my-courses|courses\/[a-z0-9-]+\/checkout)$/.test(next) ? next : "/subjects";
  return (
    <main id="main-content" tabIndex={-1} className="mx-auto w-full max-w-2xl px-4 py-8 sm:py-14">
      <section className="rounded-2xl border border-blue-100 bg-white p-5 sm:p-8">
        <h1 className="text-3xl font-extrabold">Log In</h1>
        <DemoLogin next={safeNext} />
      </section>
    </main>
  );
}
