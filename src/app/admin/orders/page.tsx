"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { CheckCircle2, ChevronLeft, ChevronRight, Download, RotateCcw, Search, XCircle } from "lucide-react";

import type { Order, OrderStatus, PaymentMethod } from "@/lib/admin-types";
import { useAdmin } from "../_lib/admin-context";
import { dateTime, downloadCsv, money, shortDate, statusLabel } from "../_lib/format";
import { Button, Card, Drawer, Empty, Field, Initials, PageTitle, Pill, Segmented, StatusBadge, textareaClass } from "../_components/ui";

type MethodFilter = "all" | PaymentMethod;
type StatusFilter = "all" | "review" | OrderStatus;
const pageSize = 12;

function OrderDetail({ order, onDone }: { order: Order; onDone: () => void }) {
  const { act, can, state } = useAdmin();
  const [reason, setReason] = useState(order.status === "refund_requested" ? order.note ?? "" : "");
  const [revoke, setRevoke] = useState(true);
  const allowed = can("sales");
  const linked = !!order.studentId && state?.students.some((student) => student.id === order.studentId);

  async function update(status: OrderStatus, message: string) {
    const ok = await act("order.status", { id: order.id, status, reason, revokeAccess: revoke && linked }, message);
    if (ok) onDone();
  }

  return (
    <div className="grid gap-5">
      <div className="flex items-center gap-3">
        <Initials name={order.studentName} className="h-12 w-12 text-sm" />
        <div className="min-w-0">
          <strong className="block">{order.studentName}</strong>
          <span className="block truncate text-sm text-[var(--muted)]">{order.studentEmail}</span>
        </div>
        <span className="flex-1" />
        <StatusBadge status={order.status} />
      </div>
      <dl className="grid grid-cols-2 gap-3 rounded-2xl bg-white p-4 text-sm ring-1 ring-[var(--line)]">
        <div><dt className="text-xs text-[var(--muted)]">Order</dt><dd className="font-semibold">{order.id}</dd></div>
        <div><dt className="text-xs text-[var(--muted)]">Date</dt><dd className="font-semibold">{dateTime(order.createdAt)}</dd></div>
        <div><dt className="text-xs text-[var(--muted)]">Payment</dt><dd className="font-semibold">{order.method}</dd></div>
        <div><dt className="text-xs text-[var(--muted)]">Plan</dt><dd className="font-semibold capitalize">{order.plan.replace("-", " ")}</dd></div>
      </dl>
      <div>
        <p className="mb-2 text-sm font-semibold">Items</p>
        <ul className="grid grid-cols-1 gap-2">
          {order.items.map((item) => (
            <li key={item.slug} className="flex items-center justify-between gap-3 rounded-2xl bg-white/70 p-3 text-sm ring-1 ring-[var(--line)]">
              <span className="min-w-0 truncate">{item.title}</span><strong>{money(item.price)}</strong>
            </li>
          ))}
        </ul>
        <p className="mt-3 flex justify-between px-1 text-base"><span>Total</span><strong>{money(order.total)}</strong></p>
      </div>
      {order.note && <p className="rounded-2xl bg-orange-50 p-3 text-sm text-orange-900"><strong>Note:</strong> {order.note}</p>}
      {order.demo && <p className="text-xs text-[var(--muted)]">Example order created for the demo dashboard.</p>}

      {(order.status === "pending" || order.status === "refund_requested" || order.status === "paid") && (
        <div className="grid grid-cols-1 gap-3 rounded-2xl bg-white p-4 ring-1 ring-[var(--line)]">
          <p className="text-sm font-semibold">Actions</p>
          <Field label="Reason (saved to the history)">
            <textarea className={textareaClass} value={reason} onChange={(event) => setReason(event.target.value)} placeholder="e.g. Duplicate purchase confirmed with the student" disabled={!allowed} />
          </Field>
          {linked && (
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={revoke} onChange={(event) => setRevoke(event.target.checked)} className="h-4 w-4 accent-[var(--deep)]" disabled={!allowed} />
              Remove course access when refunding or failing
            </label>
          )}
          <div className="flex flex-wrap gap-2">
            {order.status === "pending" && <Button variant="dark" disabled={!allowed} onClick={() => update("paid", `Payment ${order.id} confirmed`)}><CheckCircle2 size={15} /> Confirm payment</Button>}
            {order.status === "pending" && <Button variant="danger" disabled={!allowed || !reason} onClick={() => update("failed", `${order.id} marked failed`)}><XCircle size={15} /> Mark failed</Button>}
            {order.status === "refund_requested" && <Button variant="dark" disabled={!allowed} onClick={() => update("paid", "Refund declined, order kept")}>Decline refund</Button>}
            {(order.status === "refund_requested" || order.status === "paid") && <Button variant="accent" disabled={!allowed || !reason} onClick={() => update("refunded", `${order.id} refunded`)}><RotateCcw size={15} /> Approve refund</Button>}
          </div>
          {!allowed && <p className="text-xs text-[var(--muted)]">Only owners and support staff can change payments.</p>}
          {allowed && !reason && <p className="text-xs text-[var(--muted)]">A reason is required to refund or fail a payment.</p>}
        </div>
      )}
    </div>
  );
}

function OrdersInner() {
  const { state } = useAdmin();
  const params = useSearchParams();
  const router = useRouter();
  const [query, setQuery] = useState(params.get("q") ?? "");
  const [method, setMethod] = useState<MethodFilter>("all");
  const [status, setStatus] = useState<StatusFilter>((params.get("status") as StatusFilter) ?? "all");
  const [page, setPage] = useState(0);
  const openId = params.get("id");

  const filtered = useMemo(() => {
    if (!state) return [];
    const q = query.trim().toLowerCase();
    return state.orders.filter((order) =>
      (method === "all" || order.method === method)
      && (status === "all" || (status === "review" ? order.status === "pending" || order.status === "refund_requested" : order.status === status))
      && (!q || `${order.id} ${order.studentName} ${order.studentEmail} ${order.items.map((item) => item.title).join(" ")}`.toLowerCase().includes(q)));
  }, [state, query, method, status]);

  if (!state) return null;
  const pages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const current = Math.min(page, pages - 1);
  const visible = filtered.slice(current * pageSize, current * pageSize + pageSize);
  const open = state.orders.find((order) => order.id === openId) ?? null;
  const byMethod = (name: PaymentMethod) => state.orders.filter((order) => order.method === name && order.status === "paid").reduce((t, o) => t + o.total, 0);
  const setOpen = (id: string | null) => {
    const next = new URLSearchParams(params.toString());
    if (id) next.set("id", id); else next.delete("id");
    router.replace(`/admin/orders${next.size ? `?${next}` : ""}`, { scroll: false });
  };

  return (
    <>
      <PageTitle
        title="Orders &"
        accent="Payments"
        subtitle="Every order and payment status. Search by student or course, split by PayPal, Stripe and Afterpay, and handle refunds."
        actions={<Button variant="ghost" onClick={() => downloadCsv("si-tutor-orders.csv", [["Order", "Date", "Student", "Email", "Items", "Method", "Status", "Total"], ...filtered.map((o) => [o.id, o.createdAt, o.studentName, o.studentEmail, o.items.map((i) => i.title).join(" | "), o.method, statusLabel[o.status], o.total])])}><Download size={15} /> Export CSV</Button>}
      />

      <div className="mb-4 grid gap-3 sm:grid-cols-3">
        {(["Stripe", "PayPal", "Afterpay"] as const).map((name, index) => (
          <Card key={name} delay={index * 0.05} className="!p-4">
            <button type="button" className="flex w-full items-center justify-between text-left" onClick={() => { setMethod(method === name ? "all" : name); setPage(0); }} aria-pressed={method === name}>
              <span>
                <span className="text-xs text-[var(--muted)]">{name} · paid</span>
                <strong className="block text-xl tracking-[-0.02em]">{money(byMethod(name))}</strong>
              </span>
              <Pill tone={method === name ? "dark" : "mint"}>{state.orders.filter((order) => order.method === name).length} orders</Pill>
            </button>
          </Card>
        ))}
      </div>

      <Card className="!p-3">
        <div className="flex flex-wrap items-center gap-3 p-1">
          <label className="flex h-10 min-w-[240px] flex-1 items-center gap-2 rounded-full bg-white/80 px-4 ring-1 ring-[var(--line)]">
            <Search size={16} className="text-[var(--muted)]" />
            <input className="w-full bg-transparent text-sm outline-none" placeholder="Student, email, course or order ID" value={query} onChange={(event) => { setQuery(event.target.value); setPage(0); }} aria-label="Search orders" />
          </label>
          <Segmented id="method" value={method} onChange={(value) => { setMethod(value); setPage(0); }} options={[{ value: "all", label: "All" }, { value: "Stripe", label: "Stripe" }, { value: "PayPal", label: "PayPal" }, { value: "Afterpay", label: "Afterpay" }]} />
        </div>
        <div className="mt-2 flex flex-wrap gap-1.5 px-1">
          {([["all", "All statuses"], ["review", "Needs action"], ["paid", "Paid"], ["pending", "Needs review"], ["refund_requested", "Refund requested"], ["refunded", "Refunded"], ["failed", "Failed"]] as [StatusFilter, string][]).map(([value, label]) => (
            <button key={value} type="button" onClick={() => { setStatus(value); setPage(0); }} aria-pressed={status === value}
              className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${status === value ? "bg-[var(--deep)] text-white" : "bg-white/70 text-[var(--muted)] ring-1 ring-[var(--line)] hover:text-[var(--ink)]"}`}>
              {label}
            </button>
          ))}
        </div>

        <div className="mt-3 overflow-x-auto">
          <table className="w-full min-w-[760px] border-separate border-spacing-y-1.5 text-sm">
            <thead>
              <tr className="text-left text-xs text-[var(--muted)]">
                <th className="px-3 py-2 font-medium">Order</th><th className="px-3 py-2 font-medium">Student</th><th className="px-3 py-2 font-medium">Course</th>
                <th className="px-3 py-2 font-medium">Method</th><th className="px-3 py-2 font-medium">Status</th><th className="px-3 py-2 text-right font-medium">Total</th>
              </tr>
            </thead>
            <tbody>
              <AnimatePresence initial={false}>
                {visible.map((order, index) => (
                  <motion.tr
                    key={order.id}
                    layout
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ delay: index * 0.015 }}
                    onClick={() => setOpen(order.id)}
                    className="cursor-pointer bg-white/75 transition hover:bg-white [&>td:first-child]:rounded-l-2xl [&>td:last-child]:rounded-r-2xl"
                  >
                    <td className="px-3 py-3"><button type="button" className="font-semibold underline-offset-2 hover:underline" onClick={(event) => { event.stopPropagation(); setOpen(order.id); }}>{order.id}</button><span className="block text-xs text-[var(--muted)]">{shortDate(order.createdAt)}</span></td>
                    <td className="px-3 py-3"><span className="flex items-center gap-2"><Initials name={order.studentName} className="h-8 w-8 text-[10px]" /><span className="min-w-0"><span className="block font-medium">{order.studentName}</span><span className="block text-xs text-[var(--muted)]">{order.studentEmail}</span></span></span></td>
                    <td className="max-w-[260px] px-3 py-3"><span className="line-clamp-1">{order.items.map((item) => item.title).join(", ")}</span>{order.plan !== "single" && <span className="text-xs capitalize text-[var(--muted)]">{order.plan.replace("-", " ")}</span>}</td>
                    <td className="px-3 py-3">{order.method}</td>
                    <td className="px-3 py-3"><StatusBadge status={order.status} /></td>
                    <td className="px-3 py-3 text-right font-semibold">{money(order.total)}</td>
                  </motion.tr>
                ))}
              </AnimatePresence>
            </tbody>
          </table>
          {!visible.length && <Empty>No orders match these filters.</Empty>}
        </div>
        <div className="mt-2 flex items-center justify-between px-2 pb-1 text-xs text-[var(--muted)]">
          <span>{filtered.length} orders</span>
          <span className="flex items-center gap-2">
            <button type="button" aria-label="Previous page" disabled={current === 0} onClick={() => setPage(current - 1)} className="grid h-8 w-8 place-items-center rounded-full bg-white ring-1 ring-[var(--line)] disabled:opacity-40"><ChevronLeft size={14} /></button>
            Page {current + 1} of {pages}
            <button type="button" aria-label="Next page" disabled={current >= pages - 1} onClick={() => setPage(current + 1)} className="grid h-8 w-8 place-items-center rounded-full bg-white ring-1 ring-[var(--line)] disabled:opacity-40"><ChevronRight size={14} /></button>
          </span>
        </div>
      </Card>

      <Drawer open={!!open} onClose={() => setOpen(null)} title={open ? `Order ${open.id}` : ""}>
        {open && <OrderDetail key={open.id + open.status} order={open} onDone={() => setOpen(null)} />}
      </Drawer>
    </>
  );
}

export default function OrdersPage() {
  return <Suspense><OrdersInner /></Suspense>;
}
