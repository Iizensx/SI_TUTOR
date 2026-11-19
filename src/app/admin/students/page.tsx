"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { CalendarClock, CalendarPlus, Ban, Search, ShieldPlus } from "lucide-react";

import { allAccessSlug, type AdminState } from "@/lib/admin-types";
import type { UserProfile } from "@/lib/auth-types";
import { AccountAvatar } from "@/components/account-avatar";
import { useAdmin } from "../_lib/admin-context";
import { dateTime, shortDate } from "../_lib/format";
import { Button, Card, Drawer, Empty, Field, inputClass, PageTitle, Pill, Segmented, textareaClass } from "../_components/ui";

type Action = { courseSlug: string; kind: "extend" | "set" | "revoke" | "grant" } | null;

function courseName(state: AdminState, slug: string) {
  if (slug === allAccessSlug) return "All-Access Pass";
  return state.courses.find((course) => course.slug === slug)?.title ?? slug;
}

function startDate(state: AdminState, student: UserProfile, slug: string, expiresAt: string) {
  const order = state.orders.find((item) => (item.studentId === student.id || item.studentEmail === student.email) && item.items.some((entry) => entry.slug === slug) && item.status !== "refunded" && item.status !== "failed");
  if (order) return order.createdAt;
  const date = new Date(expiresAt);
  date.setMonth(date.getMonth() - state.site.accessMonths);
  return date.toISOString();
}

function AccessForm({ student, action, onDone }: { student: UserProfile; action: NonNullable<Action>; onDone: () => void }) {
  const { act, state } = useAdmin();
  const [days, setDays] = useState(30);
  const [date, setDate] = useState(() => new Date(Date.now() + 30 * 86_400_000).toISOString().slice(0, 10));
  const [months, setMonths] = useState(3);
  const [course, setCourse] = useState(action.courseSlug);
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  if (!state) return null;
  const titles = { extend: "Extend access", set: "Set end date", revoke: "Remove access", grant: "Give course access" };
  return (
    <form className="grid grid-cols-1 gap-3 rounded-2xl bg-white p-4 ring-1 ring-[var(--line)]" onSubmit={async (event) => {
      event.preventDefault();
      setBusy(true);
      const ok = await act("access.adjust", { userId: student.id, courseSlug: course, action: action.kind, days, expiresAt: date, months, reason }, "Access updated");
      setBusy(false);
      if (ok) onDone();
    }}>
      <p className="font-semibold">{titles[action.kind]}</p>
      {action.kind === "grant" ? (
        <Field label="Course">
          <select className={inputClass} value={course} onChange={(event) => setCourse(event.target.value)}>
            <option value={allAccessSlug}>All-Access Pass (every course)</option>
            {state.courses.map((item) => <option key={item.slug} value={item.slug}>{item.title}{item.hidden ? " (hidden)" : ""}</option>)}
          </select>
        </Field>
      ) : <p className="text-sm text-[var(--muted)]">{courseName(state, action.courseSlug)}</p>}
      {action.kind === "extend" && (
        <div className="flex flex-wrap gap-2">
          {[7, 30, 90].map((value) => <button key={value} type="button" onClick={() => setDays(value)} className={`rounded-full px-3 py-1.5 text-xs font-semibold ${days === value ? "bg-[var(--deep)] text-white" : "bg-[var(--mint)] text-[var(--deep)]"}`}>+{value} days</button>)}
          <input type="number" min={1} max={365} value={days} onChange={(event) => setDays(Number(event.target.value))} className={`${inputClass} !h-8 !w-24`} aria-label="Days to add" />
        </div>
      )}
      {action.kind === "set" && <Field label="New end date"><input type="date" className={inputClass} value={date} onChange={(event) => setDate(event.target.value)} required /></Field>}
      {action.kind === "grant" && <Field label="Months of access"><input type="number" min={1} max={24} className={inputClass} value={months} onChange={(event) => setMonths(Number(event.target.value))} /></Field>}
      <Field label="Reason" hint="Required. Saved to the access history and audit log.">
        <textarea className={textareaClass} required value={reason} onChange={(event) => setReason(event.target.value)} placeholder="e.g. Hospital stay, approved by the course coordinator" />
      </Field>
      <div className="flex gap-2">
        <Button type="submit" variant={action.kind === "revoke" ? "danger" : "dark"} disabled={busy || !reason.trim()}>{busy ? "Saving…" : titles[action.kind]}</Button>
        <Button variant="ghost" onClick={onDone}>Cancel</Button>
      </div>
    </form>
  );
}

function StudentPanel({ student }: { student: UserProfile }) {
  const { state, can } = useAdmin();
  const [action, setAction] = useState<Action>(null);
  const [now] = useState(() => new Date());
  if (!state) return null;
  const allowed = can("sales");
  const log = state.accessLog.filter((entry) => entry.userId === student.id);
  const orders = state.orders.filter((order) => order.studentId === student.id || order.studentEmail === student.email);
  return (
    <div className="grid gap-5">
      <div className="flex items-center gap-3" style={{ ["--avatar-size" as string]: "56px" }}>
        <AccountAvatar user={student} />
        <div className="min-w-0">
          <strong className="block text-lg">{student.firstName} {student.lastName}</strong>
          <span className="block truncate text-sm text-[var(--muted)]">{student.email}</span>
          <span className="mt-1 flex gap-1.5"><Pill>{student.level}</Pill><Pill tone="slate">Joined {shortDate(student.createdAt)}</Pill></span>
        </div>
      </div>

      <div>
        <div className="mb-2 flex items-center justify-between">
          <p className="text-sm font-semibold">Course access</p>
          <Button size="sm" variant="accent" disabled={!allowed} onClick={() => setAction({ courseSlug: state.courses[0].slug, kind: "grant" })}><ShieldPlus size={13} /> Give access</Button>
        </div>
        {action?.kind === "grant" && <AccessForm student={student} action={action} onDone={() => setAction(null)} />}
        <ul className="grid grid-cols-1 gap-2">
          {student.enrollments.map((entry) => {
            const expires = new Date(entry.expiresAt);
            const active = expires > now;
            const daysLeft = Math.ceil((expires.getTime() - now.getTime()) / 86_400_000);
            return (
              <li key={entry.courseSlug} className="rounded-2xl bg-white p-3 ring-1 ring-[var(--line)]">
                <div className="flex flex-wrap items-center gap-2">
                  <strong className="min-w-0 flex-1 truncate text-sm">{courseName(state, entry.courseSlug)}</strong>
                  {active ? <Pill tone={daysLeft <= 14 ? "accent" : "mint"}>{daysLeft} days left</Pill> : <Pill tone="rose">Expired</Pill>}
                </div>
                <p className="mt-1 text-xs text-[var(--muted)]">Start {shortDate(startDate(state, student, entry.courseSlug, entry.expiresAt))} → End {shortDate(entry.expiresAt)}</p>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  <Button size="sm" variant="light" disabled={!allowed} onClick={() => setAction({ courseSlug: entry.courseSlug, kind: "extend" })}><CalendarPlus size={13} /> Extend</Button>
                  <Button size="sm" variant="ghost" disabled={!allowed} onClick={() => setAction({ courseSlug: entry.courseSlug, kind: "set" })}><CalendarClock size={13} /> Set date</Button>
                  {active && <Button size="sm" variant="danger" disabled={!allowed} onClick={() => setAction({ courseSlug: entry.courseSlug, kind: "revoke" })}><Ban size={13} /> Remove</Button>}
                </div>
                {action && action.kind !== "grant" && action.courseSlug === entry.courseSlug && <div className="mt-3"><AccessForm student={student} action={action} onDone={() => setAction(null)} /></div>}
              </li>
            );
          })}
          {!student.enrollments.length && <li><Empty>No course access on the server yet.</Empty></li>}
        </ul>
        {!allowed && <p className="mt-2 text-xs text-[var(--muted)]">Only owners and support staff can change access.</p>}
      </div>

      <div>
        <p className="mb-2 text-sm font-semibold">Access history</p>
        <ul className="grid grid-cols-1 gap-2">
          {log.map((entry) => (
            <li key={entry.id} className="rounded-2xl bg-white/70 p-3 text-xs ring-1 ring-[var(--line)]">
              <p><strong>{courseName(state, entry.courseSlug)}</strong> · {entry.before ? shortDate(entry.before) : "none"} → {entry.after ? shortDate(entry.after) : "none"}</p>
              <p className="mt-1 text-[var(--muted)]">“{entry.reason}” — {entry.by}, {dateTime(entry.at)}</p>
            </li>
          ))}
          {!log.length && <li className="text-xs text-[var(--muted)]">No changes yet.</li>}
        </ul>
      </div>

      <div>
        <p className="mb-2 text-sm font-semibold">Orders</p>
        <ul className="grid grid-cols-1 gap-1.5 text-xs">
          {orders.slice(0, 8).map((order) => <li key={order.id} className="flex justify-between gap-2 rounded-xl bg-white/60 px-3 py-2"><span>{order.id} · {shortDate(order.createdAt)}</span><span className="truncate text-[var(--muted)]">{order.items.map((item) => item.title).join(", ")}</span></li>)}
          {!orders.length && <li className="text-[var(--muted)]">No orders.</li>}
        </ul>
      </div>
    </div>
  );
}

export default function StudentsPage() {
  const { state } = useAdmin();
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<"all" | "active" | "expiring" | "none">("all");
  const [openId, setOpenId] = useState<string | null>(null);
  const [now] = useState(() => Date.now());

  const students = useMemo(() => {
    if (!state) return [];
    const q = query.trim().toLowerCase();
    return state.students.filter((student) => {
      const times = student.enrollments.map((entry) => Date.parse(entry.expiresAt));
      const active = times.filter((time) => time > now);
      const matches = filter === "all" || (filter === "active" && active.length > 0) || (filter === "none" && active.length === 0)
        || (filter === "expiring" && active.some((time) => time - now < 14 * 86_400_000));
      return matches && (!q || `${student.firstName} ${student.lastName} ${student.email}`.toLowerCase().includes(q));
    });
  }, [state, query, filter, now]);

  if (!state) return null;
  const open = state.students.find((student) => student.id === openId) ?? null;

  return (
    <>
      <PageTitle title="Students &" accent="Access" subtitle="See each learner’s courses, start and end dates, and adjust access with a recorded reason." />
      <Card className="mb-4 flex flex-wrap items-center gap-3 !p-3">
        <label className="flex h-10 min-w-[240px] flex-1 items-center gap-2 rounded-full bg-white/80 px-4 ring-1 ring-[var(--line)]">
          <Search size={16} className="text-[var(--muted)]" />
          <input className="w-full bg-transparent text-sm outline-none" placeholder="Search by name or email" value={query} onChange={(event) => setQuery(event.target.value)} aria-label="Search students" />
        </label>
        <Segmented id="stu" value={filter} onChange={setFilter} options={[{ value: "all", label: "All" }, { value: "active", label: "Active" }, { value: "expiring", label: "Expiring soon" }, { value: "none", label: "No access" }]} />
      </Card>
      {students.length ? (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {students.map((student, index) => {
            const active = student.enrollments.filter((entry) => Date.parse(entry.expiresAt) > now);
            const soonest = active.map((entry) => Date.parse(entry.expiresAt)).sort((a, b) => a - b)[0];
            return (
              <motion.button
                key={student.id}
                type="button"
                onClick={() => setOpenId(student.id)}
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(index, 12) * 0.03 }}
                className="flex items-center gap-3 rounded-[22px] bg-white/80 p-4 text-left ring-1 ring-[var(--line)] backdrop-blur transition hover:-translate-y-0.5 hover:bg-white"
                style={{ ["--avatar-size" as string]: "46px" }}
              >
                <AccountAvatar user={student} />
                <span className="min-w-0 flex-1">
                  <strong className="block truncate text-sm">{student.firstName} {student.lastName}</strong>
                  <span className="block truncate text-xs text-[var(--muted)]">{student.email}</span>
                  <span className="mt-1.5 flex flex-wrap gap-1">
                    <Pill tone={active.length ? "mint" : "slate"}>{active.length} active</Pill>
                    {soonest && soonest - now < 14 * 86_400_000 && <Pill tone="accent">ends {shortDate(new Date(soonest).toISOString())}</Pill>}
                  </span>
                </span>
              </motion.button>
            );
          })}
        </div>
      ) : <Empty>No students match.</Empty>}
      <p className="mt-3 text-xs text-[var(--muted)]">Lists registered accounts. Example orders on the dashboard may come from people without an account.</p>
      <Drawer open={!!open} onClose={() => setOpenId(null)} title="Student" wide>
        {open && <StudentPanel key={open.id} student={open} />}
      </Drawer>
    </>
  );
}
