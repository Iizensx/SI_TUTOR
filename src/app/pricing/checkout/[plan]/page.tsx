import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PlanCheckout } from "@/components/course-access";
import { getPlan } from "@/lib/plans";

export const metadata: Metadata = { title: "Checkout | SI Tutor" };

export function generateStaticParams() {
  return [{ plan: "bundle" }, { plan: "all-access" }];
}

export default async function PlanCheckoutPage({ params }: { params: Promise<{ plan: string }> }) {
  const plan = getPlan((await params).plan);
  if (!plan || plan.id === "single") notFound();
  return (
    <main id="main-content" tabIndex={-1} className="mx-auto w-full max-w-3xl px-4 py-8 sm:py-14">
      <section className="rounded-[28px] border border-slate-100 bg-white p-5 shadow-[0_24px_50px_-32px_rgba(15,23,42,0.35)] sm:p-8">
        <Link className="text-sm font-semibold text-blue-700 hover:underline" href="/pricing">← Back to pricing</Link>
        <div className="mt-5 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs font-bold tracking-[0.18em] text-sky-700">{plan.badge.toUpperCase()}</p>
            <h1 className="mt-2 text-3xl font-semibold tracking-[-0.03em] text-slate-900 sm:text-4xl">{plan.name}</h1>
            <p className="mt-2 max-w-md text-sm text-slate-600">{plan.description}</p>
          </div>
          <p className="text-right">
            {plan.originalPrice && <span className="mr-2 text-xl text-slate-400 line-through">${plan.originalPrice}</span>}
            <span className="text-4xl font-semibold tracking-[-0.04em] text-slate-900">${plan.price}</span>
            <span className="block text-xs text-slate-500">AUD {plan.unit} · 3 months access</span>
          </p>
        </div>
        <PlanCheckout plan={plan.id} price={plan.price} />
      </section>
    </main>
  );
}
