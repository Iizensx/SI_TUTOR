"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
import { animate, motion, useMotionValue, useTransform } from "framer-motion";
import { useEffect } from "react";
import { ArrowRight, ArrowUpRight, ChevronLeft, ChevronRight, CreditCard, GraduationCap, ShoppingBag, TrendingDown, TrendingUp, Wallet } from "lucide-react";

import type { Order } from "@/lib/admin-types";
import { useAdmin } from "./_lib/admin-context";
import { counted, daysAgo, inRange, money, shortDate } from "./_lib/format";
import { Button, Card, Initials, StatusBadge } from "./_components/ui";
import { Donut, donutColors, RevenueArea, Sparkline } from "./_components/charts";
import styles from "./admin.module.css";

function Counter({ value, format }: { value: number; format: (value: number) => string }) {
  const motionValue = useMotionValue(0);
  const text = useTransform(motionValue, (latest) => format(Math.round(latest)));
  useEffect(() => {
    const controls = animate(motionValue, value, { duration: 1.2, ease: [0.22, 1, 0.36, 1] });
    return () => controls.stop();
  }, [value, motionValue]);
  return <motion.span>{text}</motion.span>;
}

function dailySeries(orders: Order[], days: number) {
  const buckets = Array.from({ length: days }, (_, index) => {
    const date = new Date(daysAgo(days - 1 - index));
    return { key: date.toDateString(), label: date.toLocaleDateString("en-AU", { day: "numeric", month: "short" }), revenue: 0, orders: 0 };
  });
  const map = new Map(buckets.map((bucket) => [bucket.key, bucket]));
  for (const order of orders) {
    const bucket = map.get(new Date(order.createdAt).toDateString());
    if (bucket && counted(order)) { bucket.revenue += order.total; bucket.orders += 1; }
  }
  return buckets;
}

function Kpi({ label, value, previous, format, icon: Icon, spark, delay, tone }: {
  label: string; value: number; previous: number; format: (value: number) => string;
  icon: typeof Wallet; spark: number[]; delay: number; tone: string;
}) {
  const change = previous ? ((value - previous) / previous) * 100 : 0;
  const up = change >= 0;
  return (
    <Card delay={delay} className="relative overflow-hidden">
      <div className="flex items-start justify-between">
        <span className="grid h-10 w-10 place-items-center rounded-2xl" style={{ background: tone }}><Icon size={18} /></span>
        <span className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-[11px] font-semibold ${up ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"}`}>
          {up ? <TrendingUp size={12} /> : <TrendingDown size={12} />}{Math.abs(change).toFixed(0)}%
        </span>
      </div>
      <p className="mt-4 text-xs font-medium text-[var(--muted)]">{label}</p>
      <p className="mt-1 text-[28px] font-semibold tracking-[-0.03em]"><Counter value={value} format={format} /></p>
      <p className="text-[11px] text-[var(--muted)]">vs previous 30 days</p>
      <div className="-mx-1 mt-2"><Sparkline values={spark} /></div>
    </Card>
  );
}

function WeekCalendar({ orders }: { orders: Order[] }) {
  const [offset, setOffset] = useState(0);
  const [picked, setPicked] = useState(() => new Date().toDateString());
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  start.setDate(start.getDate() - ((start.getDay() + 6) % 7) + offset * 7);
  const days = Array.from({ length: 7 }, (_, index) => new Date(start.getTime() + index * 86_400_000));
  const dayOrders = (date: Date) => orders.filter((order) => new Date(order.createdAt).toDateString() === date.toDateString());
  const selected = orders.filter((order) => new Date(order.createdAt).toDateString() === picked).slice(0, 4);
  return (
    <Card delay={0.1} className="flex min-w-0 flex-col">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold tracking-[-0.02em]">{start.toLocaleDateString("en-AU", { month: "long", year: "numeric" })}</h2>
        <div className="flex gap-1">
          <button type="button" aria-label="Previous week" onClick={() => setOffset(offset - 1)} className="grid h-8 w-8 place-items-center rounded-full bg-white ring-1 ring-[var(--line)]"><ChevronLeft size={15} /></button>
          <button type="button" aria-label="Next week" onClick={() => setOffset(offset + 1)} disabled={offset >= 0} className="grid h-8 w-8 place-items-center rounded-full bg-white ring-1 ring-[var(--line)] disabled:opacity-40"><ChevronRight size={15} /></button>
        </div>
      </div>
      <div className="mt-4 grid grid-cols-7 gap-1.5">
        {days.map((day) => {
          const count = dayOrders(day).length;
          const active = day.toDateString() === picked;
          return (
            <button
              key={day.toISOString()}
              type="button"
              onClick={() => setPicked(day.toDateString())}
              aria-pressed={active}
              aria-label={`${day.toLocaleDateString("en-AU", { weekday: "long", day: "numeric", month: "long" })}: ${count} orders`}
              className={`relative grid justify-items-center gap-1 rounded-2xl py-2.5 text-xs transition ${active ? "text-white" : "hover:bg-white"}`}
            >
              {active && <motion.span layoutId="cal-day" className="absolute inset-0 rounded-2xl bg-[var(--deep)]" transition={{ type: "spring", stiffness: 420, damping: 34 }} />}
              <span className={`relative text-[10px] ${active ? "text-white/70" : "text-[var(--muted)]"}`}>{day.toLocaleDateString("en-AU", { weekday: "short" })}</span>
              <span className="relative text-sm font-semibold">{day.getDate()}</span>
              <span className="relative flex h-1.5 gap-0.5">{Array.from({ length: Math.min(3, count) }, (_, i) => <i key={i} className={`h-1.5 w-1.5 rounded-full ${active ? "bg-[var(--accent)]" : "bg-[var(--deep-2)]"}`} />)}</span>
            </button>
          );
        })}
      </div>
      <p className="mt-4 text-xs font-semibold uppercase tracking-[0.14em] text-[var(--muted)]">Orders that day</p>
      <ul className="mt-2 grid min-w-0 gap-2">
        {selected.length ? selected.map((order) => (
          <li key={order.id} className="flex min-w-0 items-center gap-3 rounded-2xl bg-white/70 p-2.5">
            <Initials name={order.studentName} />
            <span className="min-w-0 flex-1">
              <strong className="block truncate text-sm">{order.studentName}</strong>
              <span className="block truncate text-xs text-[var(--muted)]">{order.items.map((item) => item.title).join(", ")}</span>
            </span>
            <span className="text-sm font-semibold">{money(order.total)}</span>
          </li>
        )) : <li className="rounded-2xl bg-white/50 p-4 text-center text-xs text-[var(--muted)]">No orders on this day.</li>}
      </ul>
    </Card>
  );
}

export default function OverviewPage() {
  const { state, act, can } = useAdmin();
  const data = useMemo(() => {
    if (!state) return null;
    const { orders, courses, students } = state;
    const current = orders.filter((order) => inRange(order, daysAgo(30)));
    const previous = orders.filter((order) => inRange(order, daysAgo(60), daysAgo(30)));
    const sum = (list: Order[]) => list.filter(counted).reduce((total, order) => total + order.total, 0);
    const firstOrder = new Map<string, number>();
    for (const order of orders) {
      const time = Date.parse(order.createdAt);
      firstOrder.set(order.studentEmail, Math.min(firstOrder.get(order.studentEmail) ?? Infinity, time));
    }
    const newLearners = (from: number, to: number) => {
      const emails = new Set<string>();
      firstOrder.forEach((time, email) => { if (time >= from && time < to) emails.add(email); });
      students.forEach((student) => { const time = Date.parse(student.createdAt); if (time >= from && time < to) emails.add(student.email); });
      return emails.size;
    };
    const series = dailySeries(orders, 30);
    const units = new Map<string, { units: number; revenue: number }>();
    for (const order of current.filter(counted)) {
      for (const item of order.items) {
        const entry = units.get(item.slug) ?? { units: 0, revenue: 0 };
        entry.units += 1;
        entry.revenue += item.price;
        units.set(item.slug, entry);
      }
    }
    const best = [...units.entries()]
      .map(([slug, value]) => ({ ...value, course: courses.find((course) => course.slug === slug), slug }))
      .filter((entry) => entry.course)
      .sort((a, b) => b.units - a.units)
      .slice(0, 5);
    const methods = (["Stripe", "PayPal", "Afterpay"] as const).map((name) => ({ name, value: current.filter((order) => order.method === name && counted(order)).reduce((t, o) => t + o.total, 0) }));
    const review = orders.filter((order) => order.status === "pending" || order.status === "refund_requested");
    const recentStudents = [...new Map(orders.slice(0, 20).map((order) => [order.studentEmail, order.studentName])).values()].slice(0, 5);
    const weekly = (list: Order[], fn: (list: Order[]) => number) => Array.from({ length: 8 }, (_, index) => fn(list.filter((order) => inRange(order, daysAgo(56 - index * 7), daysAgo(49 - index * 7)))));
    return {
      revenue: sum(current), revenuePrev: sum(previous),
      orders: current.length, ordersPrev: previous.length,
      learners: newLearners(daysAgo(30), Infinity), learnersPrev: newLearners(daysAgo(60), daysAgo(30)),
      aov: current.length ? sum(current) / current.filter(counted).length : 0, aovPrev: previous.length ? sum(previous) / Math.max(1, previous.filter(counted).length) : 0,
      series, best, methods, review, recentStudents,
      sparkRevenue: weekly(orders, sum), sparkOrders: weekly(orders, (list) => list.length),
      liveCourses: courses.filter((course) => !course.hidden).length,
    };
  }, [state]);

  if (!state || !data) return null;
  const pendingCount = data.review.filter((order) => order.status === "pending").length;
  const refundCount = data.review.length - pendingCount;
  const methodTotal = data.methods.reduce((total, method) => total + method.value, 0) || 1;

  return (
    <div className="grid grid-cols-1 gap-4">
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
        <motion.section
          className="relative isolate overflow-hidden rounded-[30px] bg-gradient-to-br from-[var(--deep)] via-[#1b3d37] to-[#24524a] p-6 text-white shadow-[0_30px_60px_-34px_#0b1f1b] sm:p-8"
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          aria-labelledby="welcome"
        >
          <motion.span aria-hidden="true" className="absolute -right-16 -top-24 -z-10 h-72 w-72 rounded-full bg-[#8fc7b5]/25 blur-2xl" animate={{ x: [0, -30, 0], y: [0, 20, 0] }} transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }} />
          <div className="flex h-full flex-col justify-between gap-8">
          <div className="flex flex-wrap items-start justify-between gap-6">
            <div className="max-w-xl">
              <p className="text-sm text-[#a8c2bb]">Welcome back, {state.me.firstName}</p>
              <h1 id="welcome" className="mt-2 text-[clamp(28px,3.4vw,42px)] font-semibold leading-[1.05] tracking-[-0.03em]">
                Learning is always <span className={`${styles.serif} text-[#f6c08f]`}>better</span> together
              </h1>
              <p className="mt-3 text-sm leading-relaxed text-[#cfe0db]">
                {pendingCount} payment{pendingCount === 1 ? "" : "s"} waiting for review and {refundCount} refund request{refundCount === 1 ? "" : "s"}. {data.liveCourses} courses are live on {state.site.name}.
              </p>
              <div className="mt-5 flex flex-wrap gap-2">
                <Link href="/admin/orders?status=review" className="inline-flex h-10 items-center gap-2 rounded-full bg-[var(--accent)] px-4 text-sm font-semibold text-[var(--accent-ink)] transition hover:brightness-105">
                  <CreditCard size={16} /> Review payments
                </Link>
                <Link href="/admin/reports" className="inline-flex h-10 items-center gap-2 rounded-full bg-white/10 px-4 text-sm font-semibold ring-1 ring-white/20 transition hover:bg-white/15">
                  Open reports <ArrowUpRight size={15} />
                </Link>
              </div>
            </div>
            <div className="flex flex-col items-end gap-2">
              <div className="flex -space-x-2">
                {data.recentStudents.map((name) => <Initials key={name} name={name} className="ring-[var(--deep)]" />)}
              </div>
              <span className="text-xs text-[#a8c2bb]">Recent buyers</span>
            </div>
          </div>
          <dl className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {[
              { label: "Live courses", value: data.liveCourses },
              { label: "Hidden courses", value: state.courses.length - data.liveCourses },
              { label: "Student accounts", value: state.students.length },
              { label: "Orders all-time", value: state.orders.length },
            ].map((item, index) => (
              <motion.div key={item.label} className="rounded-2xl bg-white/[0.07] p-3.5 ring-1 ring-white/10" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 + index * 0.07 }}>
                <dt className="text-[11px] text-[#a8c2bb]">{item.label}</dt>
                <dd className="mt-1 text-2xl font-semibold tracking-[-0.03em]">{item.value}</dd>
              </motion.div>
            ))}
          </dl>
          </div>
        </motion.section>
        <WeekCalendar orders={state.orders} />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Kpi label="Revenue (30 days)" value={data.revenue} previous={data.revenuePrev} format={(v) => money(v)} icon={Wallet} spark={data.sparkRevenue} delay={0.05} tone="#d6ebe3" />
        <Kpi label="Orders (30 days)" value={data.orders} previous={data.ordersPrev} format={(v) => String(v)} icon={ShoppingBag} spark={data.sparkOrders} delay={0.1} tone="#fde2c8" />
        <Kpi label="New learners" value={data.learners} previous={data.learnersPrev} format={(v) => String(v)} icon={GraduationCap} spark={data.sparkOrders.map((v) => Math.round(v * 0.6))} delay={0.15} tone="#dfe3fb" />
        <Kpi label="Average order" value={data.aov} previous={data.aovPrev} format={(v) => money(v)} icon={CreditCard} spark={data.sparkRevenue.map((v, i) => v / Math.max(1, data.sparkOrders[i]))} delay={0.2} tone="#f6dbe4" />
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
        <Card delay={0.15}>
          <div className="flex flex-wrap items-end justify-between gap-2">
            <div>
              <h2 className="text-lg font-semibold tracking-[-0.02em]">Revenue, last 30 days</h2>
              <p className="text-xs text-[var(--muted)]">Paid and pending orders, by day</p>
            </div>
            <p className="text-2xl font-semibold tracking-[-0.03em]">{money(data.revenue)}</p>
          </div>
          <div className="mt-4"><RevenueArea data={data.series} /></div>
        </Card>
        <Card delay={0.2}>
          <h2 className="text-lg font-semibold tracking-[-0.02em]">Payment methods</h2>
          <p className="text-xs text-[var(--muted)]">Share of revenue, 30 days</p>
          <Donut data={data.methods} />
          <ul className="grid grid-cols-1 gap-2">
            {data.methods.map((method, index) => (
              <li key={method.name} className="flex items-center gap-2 text-sm">
                <i className="h-2.5 w-2.5 rounded-full" style={{ background: donutColors[index] }} />
                <span className="flex-1">{method.name}</span>
                <span className="text-[var(--muted)]">{Math.round((method.value / methodTotal) * 100)}%</span>
                <strong>{money(method.value)}</strong>
              </li>
            ))}
          </ul>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <Card delay={0.2}>
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold tracking-[-0.02em]">Best-selling courses</h2>
              <p className="text-xs text-[var(--muted)]">Units sold in the last 30 days</p>
            </div>
            <Link href="/admin/reports" className="inline-flex items-center gap-1 text-sm font-semibold text-[var(--deep-2)]">Details <ArrowRight size={14} /></Link>
          </div>
          <ul className="mt-4 grid grid-cols-1 gap-3">
            {data.best.map((entry, index) => {
              const max = data.best[0]?.units || 1;
              return (
                <motion.li key={entry.slug} className="flex items-center gap-3" initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.25 + index * 0.06 }}>
                  <span className="relative h-12 w-12 flex-none overflow-hidden rounded-2xl bg-white">
                    <Image src={entry.course!.cover} alt="" fill sizes="48px" className="object-cover" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <strong className="block truncate text-sm">{entry.course!.title}</strong>
                    <span className="mt-1.5 block h-2 overflow-hidden rounded-full bg-[var(--mint)]">
                      <motion.i className="block h-full rounded-full bg-[var(--deep-2)]" initial={{ width: 0 }} animate={{ width: `${(entry.units / max) * 100}%` }} transition={{ duration: 0.9, delay: 0.3 + index * 0.06 }} />
                    </span>
                  </span>
                  <span className="w-20 text-right text-sm"><strong>{entry.units}</strong> <span className="text-[var(--muted)]">sold</span></span>
                </motion.li>
              );
            })}
          </ul>
        </Card>

        <Card delay={0.25}>
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold tracking-[-0.02em]">Payments to review</h2>
              <p className="text-xs text-[var(--muted)]">Pending payments and refund requests</p>
            </div>
            <Link href="/admin/orders?status=review" className="inline-flex items-center gap-1 text-sm font-semibold text-[var(--deep-2)]">All <ArrowRight size={14} /></Link>
          </div>
          <ul className="mt-4 grid grid-cols-1 gap-2">
            {data.review.slice(0, 5).map((order) => (
              <li key={order.id} className="flex flex-wrap items-center gap-3 rounded-2xl bg-white/70 p-3">
                <Initials name={order.studentName} />
                <span className="min-w-0 flex-1">
                  <strong className="block truncate text-sm">{order.studentName} <span className="font-normal text-[var(--muted)]">· {order.id}</span></strong>
                  <span className="block truncate text-xs text-[var(--muted)]">{order.method} · {shortDate(order.createdAt)} · {money(order.total)}</span>
                </span>
                <StatusBadge status={order.status} />
                {order.status === "pending" ? (
                  <Button size="sm" variant="dark" disabled={!can("sales")} title={can("sales") ? undefined : "Support or owner role required"} onClick={() => act("order.status", { id: order.id, status: "paid" }, `Payment ${order.id} confirmed`)}>Confirm</Button>
                ) : (
                  <Link href={`/admin/orders?id=${order.id}`} className="inline-flex h-8 items-center rounded-full bg-white px-3 text-xs font-semibold ring-1 ring-[var(--line)]">Review</Link>
                )}
              </li>
            ))}
            {!data.review.length && <li className="rounded-2xl bg-white/50 p-6 text-center text-sm text-[var(--muted)]">All caught up 🎉</li>}
          </ul>
        </Card>
      </div>
    </div>
  );
}
