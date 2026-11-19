"use client";

import { useMemo, useState, type FormEvent } from "react";
import { motion } from "framer-motion";
import { History, Search, ShieldCheck, UserPlus } from "lucide-react";

import { permissions, type SiteSettings } from "@/lib/admin-types";
import type { AdminRole } from "@/lib/auth-types";
import { AccountAvatar } from "@/components/account-avatar";
import { useAdmin } from "../_lib/admin-context";
import { dateTime } from "../_lib/format";
import { Button, Card, Empty, Field, inputClass, PageTitle, Pill, Segmented, textareaClass } from "../_components/ui";

const roleText: Record<AdminRole, string> = {
  owner: "Everything, including team members and site settings",
  editor: "Subjects, courses, lessons and files",
  support: "Orders, payments, refunds and student access",
};

function SiteForm() {
  const { state, act, can } = useAdmin();
  const [site, setSite] = useState<SiteSettings>(state!.site);
  const [busy, setBusy] = useState(false);
  const allowed = can("team");
  const set = (key: keyof SiteSettings) => (value: string) => setSite((current) => ({ ...current, [key]: key === "accessMonths" ? Number(value) : value }));
  async function submit(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    await act("site.update", { site }, "Site settings saved");
    setBusy(false);
  }
  return (
    <Card>
      <h2 className="text-lg font-semibold tracking-[-0.02em]">Website</h2>
      <p className="text-xs text-[var(--muted)]">Basic information about SI Tutor</p>
      <form onSubmit={submit} className="mt-4">
        <fieldset disabled={!allowed || busy} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Site name"><input className={inputClass} value={site.name} onChange={(event) => set("name")(event.target.value)} required /></Field>
          <Field label="Support email"><input className={inputClass} type="email" value={site.supportEmail} onChange={(event) => set("supportEmail")(event.target.value)} /></Field>
          <div className="sm:col-span-2"><Field label="Tagline"><input className={inputClass} value={site.tagline} onChange={(event) => set("tagline")(event.target.value)} /></Field></div>
          <Field label="Currency"><select className={inputClass} value={site.currency} onChange={(event) => set("currency")(event.target.value)}>{["AUD", "USD", "THB", "GBP", "EUR"].map((code) => <option key={code}>{code}</option>)}</select></Field>
          <Field label="Months of access per purchase"><input className={inputClass} type="number" min={1} max={24} value={site.accessMonths} onChange={(event) => set("accessMonths")(event.target.value)} /></Field>
          <div className="sm:col-span-2"><Field label="Announcement" hint="Short message for learners (optional)"><textarea className={textareaClass} maxLength={200} value={site.announcement} onChange={(event) => set("announcement")(event.target.value)} /></Field></div>
        </fieldset>
        <div className="mt-4 flex items-center gap-3">
          <Button type="submit" variant="dark" disabled={!allowed || busy}>{busy ? "Saving…" : "Save settings"}</Button>
          {!allowed && <span className="text-xs text-[var(--muted)]">Only owners can change site settings.</span>}
        </div>
      </form>
    </Card>
  );
}

function Team() {
  const { state, act, can } = useAdmin();
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<AdminRole>("support");
  const allowed = can("team");
  if (!state) return null;
  return (
    <Card delay={0.05}>
      <h2 className="text-lg font-semibold tracking-[-0.02em]">Admin accounts</h2>
      <p className="text-xs text-[var(--muted)]">Who can open this dashboard and what they can do</p>
      <ul className="mt-4 grid grid-cols-1 gap-2">
        {state.admins.map((admin) => (
          <li key={admin.id} className="flex flex-wrap items-center gap-3 rounded-2xl bg-white/80 p-3 ring-1 ring-[var(--line)]" style={{ ["--avatar-size" as string]: "40px" }}>
            <AccountAvatar user={admin} />
            <span className="min-w-0 flex-1">
              <strong className="block truncate text-sm">{admin.firstName} {admin.lastName} {admin.id === state.me.id && <Pill tone="mint">You</Pill>}</strong>
              <span className="block truncate text-xs text-[var(--muted)]">{admin.email}</span>
            </span>
            <select
              className="h-9 rounded-full bg-white px-3 text-xs font-semibold capitalize ring-1 ring-[var(--line)] disabled:opacity-50"
              value={admin.adminRole ?? "support"}
              disabled={!allowed || admin.id === state.me.id}
              aria-label={`Role for ${admin.email}`}
              onChange={(event) => act("admin.set", { email: admin.email, adminRole: event.target.value }, "Role updated")}
            >
              {(["owner", "editor", "support"] as AdminRole[]).map((value) => <option key={value} value={value}>{value}</option>)}
            </select>
            <Button size="sm" variant="danger" disabled={!allowed || admin.id === state.me.id} onClick={() => act("admin.set", { email: admin.email, adminRole: null }, "Admin access removed")}>Remove</Button>
          </li>
        ))}
      </ul>
      <form className="mt-3 flex flex-wrap gap-2 rounded-2xl bg-white/60 p-3 ring-1 ring-[var(--line)]" onSubmit={async (event) => {
        event.preventDefault();
        if (await act("admin.set", { email, adminRole: role }, "Admin added")) setEmail("");
      }}>
        <input className={`${inputClass} min-w-[200px] flex-1`} type="email" required placeholder="Email of an existing account" value={email} onChange={(event) => setEmail(event.target.value)} disabled={!allowed} />
        <select className={`${inputClass} !w-auto capitalize`} value={role} onChange={(event) => setRole(event.target.value as AdminRole)} disabled={!allowed}>
          {(["owner", "editor", "support"] as AdminRole[]).map((value) => <option key={value} value={value}>{value}</option>)}
        </select>
        <Button type="submit" variant="accent" disabled={!allowed}><UserPlus size={15} /> Add admin</Button>
      </form>
      <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-3">
        {(["owner", "editor", "support"] as AdminRole[]).map((value) => (
          <div key={value} className="rounded-2xl bg-white/70 p-3 ring-1 ring-[var(--line)]">
            <p className="flex items-center gap-1.5 text-sm font-semibold capitalize"><ShieldCheck size={14} /> {value}</p>
            <p className="mt-1 text-xs text-[var(--muted)]">{roleText[value]}</p>
            <p className="mt-2 flex flex-wrap gap-1">
              {permissions[value].catalog && <Pill>Catalog</Pill>}
              {permissions[value].sales && <Pill tone="accent">Sales</Pill>}
              {permissions[value].team && <Pill tone="dark">Team</Pill>}
            </p>
          </div>
        ))}
      </div>
    </Card>
  );
}

function AuditLog() {
  const { state } = useAdmin();
  const [query, setQuery] = useState("");
  const [area, setArea] = useState<"all" | "course" | "access" | "order" | "admin">("all");
  const entries = useMemo(() => {
    if (!state) return [];
    const q = query.trim().toLowerCase();
    const match = (action: string) => area === "all"
      || (area === "course" && /course|lesson|upload|site/i.test(action))
      || (area === "access" && /access/i.test(action))
      || (area === "order" && /payment|refund|order/i.test(action))
      || (area === "admin" && /admin|role/i.test(action));
    return state.audit.filter((entry) => match(entry.action) && (!q || `${entry.action} ${entry.target} ${entry.by} ${entry.detail ?? ""}`.toLowerCase().includes(q)));
  }, [state, query, area]);
  return (
    <Card delay={0.1}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="flex items-center gap-2 text-lg font-semibold tracking-[-0.02em]"><History size={18} /> Change history</h2>
          <p className="text-xs text-[var(--muted)]">Every change made in the admin area</p>
        </div>
        <Segmented id="audit" value={area} onChange={setArea} options={[{ value: "all", label: "All" }, { value: "course", label: "Catalog" }, { value: "order", label: "Payments" }, { value: "access", label: "Access" }, { value: "admin", label: "Team" }]} />
      </div>
      <label className="mt-3 flex h-10 items-center gap-2 rounded-full bg-white/80 px-4 ring-1 ring-[var(--line)]">
        <Search size={16} className="text-[var(--muted)]" />
        <input className="w-full bg-transparent text-sm outline-none" placeholder="Search history" value={query} onChange={(event) => setQuery(event.target.value)} aria-label="Search history" />
      </label>
      <ol className="relative mt-4 grid gap-3 border-l-2 border-dashed border-[var(--line)] pl-5">
        {entries.slice(0, 60).map((entry, index) => (
          <motion.li key={entry.id} className="relative" initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: Math.min(index, 15) * 0.02 }}>
            <span className="absolute -left-[27px] top-1.5 h-3 w-3 rounded-full border-2 border-white bg-[var(--deep-2)]" />
            <p className="text-sm"><strong>{entry.action}</strong> · {entry.target}</p>
            {entry.detail && <p className="text-xs text-[var(--muted)]">{entry.detail}</p>}
            <p className="mt-0.5 text-[11px] text-[var(--muted)]">{entry.by} · <span className="capitalize">{entry.role}</span> · {dateTime(entry.at)}</p>
          </motion.li>
        ))}
      </ol>
      {!entries.length && <Empty>No changes recorded yet.</Empty>}
    </Card>
  );
}

export default function SettingsPage() {
  const { state } = useAdmin();
  if (!state) return null;
  return (
    <>
      <PageTitle title="Settings" accent="& team" subtitle="Website details, admin accounts and permissions, and the full history of changes." />
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <div className="grid content-start gap-4"><SiteForm /><Team /></div>
        <AuditLog />
      </div>
    </>
  );
}
