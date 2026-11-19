"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Download, Repeat, ShoppingBag, Undo2, Users, Wallet } from "lucide-react";

import type { Order } from "@/lib/admin-types";
import { allAccessSlug } from "@/lib/admin-types";
import { useAdmin } from "../_lib/admin-context";
import { counted, downloadCsv, money, statusLabel } from "../_lib/format";
import { Button, Card, Empty, PageTitle, Segmented } from "../_components/ui";
import { RevenueBars } from "../_components/charts";

type Range = "7" | "30" | "90" | "365" | "custom";

function bucketKey(date: Date, unit: "day" | "week" | "month") {
  if (unit === "day") return { key: date.toDateString(), label: date.toLocaleDateString("en-AU", { day: "numeric", month: "short" }) };
  if (unit === "month") return { key: `${date.getFullYear()}-${date.getMonth()}`, label: date.toLocaleDateString("en-AU", { month: "short", year: "2-digit" }) };
  const monday = new Date(date);
  monday.setHours(0, 0, 0, 0);
  monday.setDate(monday.getDate() - ((monday.getDay() + 6) % 7));
  return { key: monday.toDateString(), label: `Wk ${monday.toLocaleDateString("en-AU", { day: "numeric", month: "short" })}` };
}

export default function ReportsPage() {
  const { state } = useAdmin();
  const [range, setRange] = useState<Range>("30");
  const [today] = useState(() => new Date().toISOString().slice(0, 10));
  const [from, setFrom] = useState(() => new Date(Date.now() - 60 * 86_400_000).toISOString().slice(0, 10));
  const [to, setTo] = useState(today);

  const report = useMemo(() => {
    if (!state) return null;
    const end = range === "custom" ? new Date(`${to}T23:59:59`).getTime() : new Date(`${today}T23:59:59`).getTime();
    const start = range === "custom" ? new Date(`${from}T00:00:00`).getTime() : end - Number(range) * 86_400_000 + 1;
    const span = (end - start) / 86_400_000;
    const unit: "day" | "week" | "month" = span <= 31 ? "day" : span <= 120 ? "week" : "month";
    const inRange = state.orders.filter((order) => { const t = Date.parse(order.createdAt); return t >= start && t <= end; });
    const paid = inRange.filter(counted);

    // Revenue over time (empty buckets included so gaps show)
    const buckets = new Map<string, { label: string; revenue: number; orders: number }>();
    for (let t = start; t <= end; t += 86_400_000) {
      const { key, label } = bucketKey(new Date(t), unit);
      if (!buckets.has(key)) buckets.set(key, { label, revenue: 0, orders: 0 });
    }
    for (const order of paid) {
      const bucket = buckets.get(bucketKey(new Date(order.createdAt), unit).key);
      if (bucket) { bucket.revenue += order.total; bucket.orders += 1; }
    }

    // Revenue by course
    const byCourse = new Map<string, { title: string; units: number; revenue: number; buyers: Set<string> }>();
    for (const order of paid) {
      for (const item of order.items) {
        const entry = byCourse.get(item.slug) ?? { title: item.slug === allAccessSlug ? "All-Access Pass" : state.courses.find((c) => c.slug === item.slug)?.title ?? item.title, units: 0, revenue: 0, buyers: new Set() };
        entry.units += 1;
        entry.revenue += item.price;
        entry.buyers.add(order.studentEmail);
        byCourse.set(item.slug, entry);
      }
    }
    const courses = [...byCourse.entries()].map(([slug, value]) => ({ slug, ...value, buyers: value.buyers.size })).sort((a, b) => b.revenue - a.revenue);

    // Buyers and continuation (bought again: more than one order in range, or a paid order before the range)
    const buyers = new Set(paid.map((order) => order.studentEmail));
    const earlier = new Set(state.orders.filter((order) => counted(order) && Date.parse(order.createdAt) < start).map((order) => order.studentEmail));
    const countByBuyer = new Map<string, number>();
    paid.forEach((order) => countByBuyer.set(order.studentEmail, (countByBuyer.get(order.studentEmail) ?? 0) + 1));
    const returning = [...buyers].filter((email) => earlier.has(email) || (countByBuyer.get(email) ?? 0) > 1).length;
    const refunded = inRange.filter((order) => order.status === "refunded");

    return {
      unit, inRange, paid, courses, series: [...buckets.values()],
      revenue: paid.reduce((total, order) => total + order.total, 0),
      buyers: buyers.size,
      continuation: buyers.size ? Math.round((returning / buyers.size) * 100) : 0,
      refundRate: inRange.length ? Math.round((refunded.length / inRange.length) * 1000) / 10 : 0,
      refundedAmount: refunded.reduce((total, order) => total + order.total, 0),
    };
  }, [state, range, from, to, today]);

  if (!state || !report) return null;
  const maxRevenue = report.courses[0]?.revenue || 1;
  const exportOrders = (list: Order[]) => downloadCsv(`si-tutor-orders-${range}.csv`, [["Order", "Date", "Student", "Email", "Plan", "Items", "Method", "Status", "Total"], ...list.map((o) => [o.id, o.createdAt, o.studentName, o.studentEmail, o.plan, o.items.map((i) => i.title).join(" | "), o.method, statusLabel[o.status], o.total])]);

  return (
    <>
      <PageTitle
        title="Reports"
        accent="& insights"
        subtitle="Revenue over time and by course, buyers, how many learners come back, and CSV exports."
        actions={
          <>
            <Button variant="ghost" onClick={() => downloadCsv("si-tutor-revenue-by-course.csv", [["Course", "Units", "Buyers", `Revenue (${state.site.currency})`], ...report.courses.map((c) => [c.title, c.units, c.buyers, c.revenue.toFixed(2)])])}><Download size={15} /> By course</Button>
            <Button variant="ghost" onClick={() => downloadCsv(`si-tutor-revenue-by-${report.unit}.csv`, [["Period", "Orders", `Revenue (${state.site.currency})`], ...report.series.map((p) => [p.label, p.orders, p.revenue.toFixed(2)])])}><Download size={15} /> Over time</Button>
            <Button variant="dark" onClick={() => exportOrders(report.inRange)}><Download size={15} /> Orders CSV</Button>
          </>
        }
      />

      <Card className="mb-4 flex flex-wrap items-center justify-between gap-3 !p-3">
        <Segmented id="range" value={range} onChange={setRange} options={[{ value: "7", label: "7 days" }, { value: "30", label: "30 days" }, { value: "90", label: "90 days" }, { value: "365", label: "12 months" }, { value: "custom", label: "Custom" }]} />
        {range === "custom" && (
          <div className="flex flex-wrap items-center gap-2 text-sm">
            <input type="date" value={from} max={to} onChange={(event) => setFrom(event.target.value)} className="h-10 rounded-full bg-white px-3 ring-1 ring-[var(--line)]" aria-label="From" />
            →
            <input type="date" value={to} min={from} max={today} onChange={(event) => setTo(event.target.value)} className="h-10 rounded-full bg-white px-3 ring-1 ring-[var(--line)]" aria-label="To" />
          </div>
        )}
      </Card>

      <div className="mb-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {[
          { label: "Revenue", value: money(report.revenue), icon: Wallet, tone: "#d6ebe3" },
          { label: "Orders", value: String(report.paid.length), icon: ShoppingBag, tone: "#fde2c8" },
          { label: "Buyers", value: String(report.buyers), icon: Users, tone: "#dfe3fb" },
          { label: "Continuation rate", value: `${report.continuation}%`, icon: Repeat, tone: "#e6f0c8", hint: "Buyers who purchased again" },
          { label: "Refund rate", value: `${report.refundRate}%`, icon: Undo2, tone: "#f6dbe4", hint: `${money(report.refundedAmount)} refunded` },
        ].map((item, index) => (
          <Card key={item.label} delay={index * 0.05} className="!p-4">
            <span className="grid h-9 w-9 place-items-center rounded-xl" style={{ background: item.tone }}><item.icon size={16} /></span>
            <p className="mt-3 text-xs text-[var(--muted)]">{item.label}</p>
            <p className="text-2xl font-semibold tracking-[-0.03em]">{item.value}</p>
            {item.hint && <p className="text-[11px] text-[var(--muted)]">{item.hint}</p>}
          </Card>
        ))}
      </div>

      <Card className="mb-4">
        <h2 className="text-lg font-semibold tracking-[-0.02em]">Revenue by {report.unit}</h2>
        <p className="text-xs text-[var(--muted)]">Paid, pending review and refund-requested orders</p>
        <div className="mt-4"><RevenueBars data={report.series} /></div>
      </Card>

      <Card>
        <h2 className="text-lg font-semibold tracking-[-0.02em]">Revenue by course</h2>
        {report.courses.length ? (
          <div className="mt-3 overflow-x-auto">
            <table className="w-full min-w-[620px] text-sm">
              <thead><tr className="text-left text-xs text-[var(--muted)]"><th className="py-2 font-medium">Course</th><th className="py-2 font-medium">Units</th><th className="py-2 font-medium">Buyers</th><th className="w-[34%] py-2 font-medium">Share</th><th className="py-2 text-right font-medium">Revenue</th></tr></thead>
              <tbody>
                {report.courses.map((course, index) => (
                  <tr key={course.slug} className="border-t border-[var(--line)]">
                    <td className="py-2.5 pr-3 font-medium">{course.title}</td>
                    <td className="py-2.5">{course.units}</td>
                    <td className="py-2.5">{course.buyers}</td>
                    <td className="py-2.5 pr-3">
                      <span className="block h-2 overflow-hidden rounded-full bg-[var(--mint)]">
                        <motion.i className="block h-full rounded-full bg-[var(--deep-2)]" initial={{ width: 0 }} animate={{ width: `${(course.revenue / maxRevenue) * 100}%` }} transition={{ duration: 0.8, delay: Math.min(index, 10) * 0.04 }} />
                      </span>
                    </td>
                    <td className="py-2.5 text-right font-semibold">{money(course.revenue)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : <div className="mt-3"><Empty>No sales in this period.</Empty></div>}
      </Card>
    </>
  );
}
