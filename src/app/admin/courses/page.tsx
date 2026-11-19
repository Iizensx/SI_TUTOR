"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState, type FormEvent } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Clapperboard, Eye, EyeOff, ImageUp, Pencil, Plus, Search, Star } from "lucide-react";

import type { AdminCourse } from "@/lib/admin-types";
import { useAdmin } from "../_lib/admin-context";
import { money } from "../_lib/format";
import { Button, Card, Drawer, Empty, Field, inputClass, PageTitle, Pill, Segmented, Switch, textareaClass } from "../_components/ui";

type Draft = { title: string; subjectSlug: string; price: string; instructor: string; description: string; cover: string };

function CoverPicker({ value, onChange, disabled }: { value: string; onChange: (url: string) => void; disabled?: boolean }) {
  const { upload } = useAdmin();
  return (
    <div className="grid grid-cols-1 gap-2">
      <div className="relative aspect-[16/9] overflow-hidden rounded-2xl bg-[var(--mint)]">
        {value ? <Image src={value} alt="Cover preview" fill sizes="480px" className="object-cover" unoptimized={value.startsWith("http")} /> : <span className="grid h-full place-items-center text-sm text-[var(--muted)]">No cover yet</span>}
      </div>
      <div className="flex gap-2">
        <input className={inputClass} value={value} onChange={(event) => onChange(event.target.value)} placeholder="/uploads/… or https://…" aria-label="Cover image URL" disabled={disabled} />
        <label className={`inline-flex h-11 flex-none cursor-pointer items-center gap-2 rounded-2xl bg-[var(--deep)] px-4 text-sm font-semibold text-white ${disabled ? "pointer-events-none opacity-40" : ""}`}>
          <ImageUp size={16} /> Upload
          <input type="file" accept="image/png,image/jpeg,image/webp" className="sr-only" disabled={disabled} onChange={async (event) => {
            const file = event.target.files?.[0];
            if (!file) return;
            const result = await upload(file);
            if (result) onChange(result.url);
            event.target.value = "";
          }} />
        </label>
      </div>
    </div>
  );
}

function CourseForm({ initial, onSubmit, submitLabel, disabled }: { initial: Draft; onSubmit: (draft: Draft) => Promise<boolean>; submitLabel: string; disabled: boolean }) {
  const { state } = useAdmin();
  const [draft, setDraft] = useState(initial);
  const [busy, setBusy] = useState(false);
  const set = (key: keyof Draft) => (value: string) => setDraft((current) => ({ ...current, [key]: value }));
  async function submit(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    await onSubmit(draft);
    setBusy(false);
  }
  return (
    <form className="grid grid-cols-1 gap-4" onSubmit={submit}>
      <fieldset disabled={disabled || busy} className="grid grid-cols-1 gap-4">
        <Field label="Course title"><input className={inputClass} required maxLength={120} value={draft.title} onChange={(event) => set("title")(event.target.value)} /></Field>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Category">
            <select className={inputClass} value={draft.subjectSlug} onChange={(event) => set("subjectSlug")(event.target.value)}>
              {state?.subjects.map((subject) => <option key={subject.slug} value={subject.slug}>{subject.name}</option>)}
            </select>
          </Field>
          <Field label={`Price (${state?.site.currency ?? "AUD"})`}><input className={inputClass} type="number" min={0} step="0.01" required value={draft.price} onChange={(event) => set("price")(event.target.value)} /></Field>
        </div>
        <Field label="Instructor"><input className={inputClass} maxLength={80} value={draft.instructor} onChange={(event) => set("instructor")(event.target.value)} placeholder="SI Tutor Team" /></Field>
        <Field label="Description"><textarea className={textareaClass} maxLength={600} value={draft.description} onChange={(event) => set("description")(event.target.value)} /></Field>
        <Field label="Cover image"><CoverPicker value={draft.cover} onChange={set("cover")} disabled={disabled} /></Field>
      </fieldset>
      <Button type="submit" variant="dark" disabled={disabled || busy}>{busy ? "Saving…" : submitLabel}</Button>
      {disabled && <p className="text-xs text-[var(--muted)]">Only owners and editors can change courses.</p>}
    </form>
  );
}

export default function CoursesPage() {
  const { state, act, can } = useAdmin();
  const [subject, setSubject] = useState("all");
  const [query, setQuery] = useState("");
  const [visibility, setVisibility] = useState<"all" | "live" | "hidden">("all");
  const [editing, setEditing] = useState<AdminCourse | null>(null);
  const [creating, setCreating] = useState(false);
  const editable = can("catalog");

  const courses = useMemo(() => {
    if (!state) return [];
    const q = query.trim().toLowerCase();
    return state.courses.filter((course) =>
      (subject === "all" || course.subjectSlug === subject)
      && (visibility === "all" || (visibility === "live" ? !course.hidden : course.hidden))
      && (!q || `${course.title} ${course.instructor}`.toLowerCase().includes(q)));
  }, [state, subject, query, visibility]);

  if (!state) return null;

  return (
    <>
      <PageTitle
        title="Subjects &"
        accent="Courses"
        subtitle="Manage the 5 categories, prices, covers, descriptions and instructors. Hidden courses disappear from the website."
        actions={<Button variant="accent" onClick={() => setCreating(true)} disabled={!editable} title={editable ? undefined : "Owner or editor role required"}><Plus size={16} /> New course</Button>}
      />

      <div className="mb-4 grid gap-3 sm:grid-cols-3 xl:grid-cols-6">
        {[{ slug: "all", name: "All categories", image: "" }, ...state.subjects].map((item, index) => {
          const list = state.courses.filter((course) => item.slug === "all" || course.subjectSlug === item.slug);
          const active = subject === item.slug;
          return (
            <motion.button
              key={item.slug}
              type="button"
              onClick={() => setSubject(item.slug)}
              aria-pressed={active}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.04 }}
              className={`relative flex items-center gap-3 overflow-hidden rounded-[22px] p-3 text-left ring-1 transition ${active ? "bg-[var(--deep)] text-white ring-[var(--deep)]" : "bg-white/70 ring-[var(--line)] hover:bg-white"}`}
            >
              {item.image ? <span className="relative h-10 w-10 flex-none overflow-hidden rounded-xl bg-white"><Image src={item.image} alt="" fill sizes="40px" className="object-contain p-1" /></span> : <span className="grid h-10 w-10 flex-none place-items-center rounded-xl bg-[var(--mint)] text-[var(--deep)]">All</span>}
              <span className="min-w-0">
                <strong className="block truncate text-sm">{item.name}</strong>
                <span className={`text-[11px] ${active ? "text-white/70" : "text-[var(--muted)]"}`}>{list.filter((c) => !c.hidden).length} live · {list.filter((c) => c.hidden).length} hidden</span>
              </span>
            </motion.button>
          );
        })}
      </div>

      <Card className="mb-4 flex flex-wrap items-center justify-between gap-3 !p-3">
        <label className="flex h-10 min-w-[240px] flex-1 items-center gap-2 rounded-full bg-white/80 px-4 ring-1 ring-[var(--line)]">
          <Search size={16} className="text-[var(--muted)]" />
          <input className="w-full bg-transparent text-sm outline-none" placeholder="Search courses or instructors" value={query} onChange={(event) => setQuery(event.target.value)} aria-label="Search courses" />
        </label>
        <Segmented id="vis" value={visibility} onChange={setVisibility} options={[{ value: "all", label: "All" }, { value: "live", label: "Live" }, { value: "hidden", label: "Hidden" }]} />
      </Card>

      {courses.length ? (
        <motion.div layout className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
          <AnimatePresence mode="popLayout">
            {courses.map((course) => {
              const subjectName = state.subjects.find((item) => item.slug === course.subjectSlug)?.name;
              return (
                <motion.article
                  key={course.slug}
                  layout
                  initial={{ opacity: 0, scale: 0.96 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.96 }}
                  className={`group overflow-hidden rounded-[24px] bg-white/80 ring-1 ring-[var(--line)] backdrop-blur transition hover:-translate-y-1 hover:shadow-[0_24px_40px_-30px_#17332f] ${course.hidden ? "opacity-70" : ""}`}
                >
                  <div className="relative m-2 aspect-[16/9] overflow-hidden rounded-[18px] bg-[var(--mint)]">
                    <Image src={course.cover} alt="" fill sizes="360px" className="object-cover transition duration-500 group-hover:scale-105" unoptimized={course.cover.startsWith("http")} />
                    <span className="absolute left-2 top-2"><Pill tone={course.hidden ? "slate" : "dark"}>{course.hidden ? <><EyeOff size={11} /> Hidden</> : <><Eye size={11} /> Live</>}</Pill></span>
                    {course.custom && <span className="absolute right-2 top-2"><Pill tone="accent">New</Pill></span>}
                  </div>
                  <div className="px-4 pb-4">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--muted)]">{subjectName}</p>
                    <h2 className="mt-1 line-clamp-2 min-h-[2.6em] text-[15px] font-semibold leading-snug">{course.title}</h2>
                    <p className="mt-1 truncate text-xs text-[var(--muted)]">{course.instructor} · {course.lessonCount} lessons · {course.duration}</p>
                    <div className="mt-3 flex items-center justify-between">
                      <strong className="text-lg tracking-[-0.02em]">{money(course.price, state.site.currency)}</strong>
                      {course.rating > 0 && <span className="inline-flex items-center gap-1 text-xs text-[var(--muted)]"><Star size={12} className="fill-amber-400 text-amber-400" />{course.rating.toFixed(1)}</span>}
                    </div>
                    <div className="mt-3 flex items-center gap-2 border-t border-[var(--line)] pt-3">
                      <Switch
                        checked={!course.hidden}
                        label={`${course.hidden ? "Publish" : "Hide"} ${course.title}`}
                        disabled={!editable}
                        onChange={(live) => act("course.update", { slug: course.slug, patch: { hidden: !live } }, live ? "Course is live" : "Course hidden")}
                      />
                      <span className="text-xs text-[var(--muted)]">{course.hidden ? "Hidden" : "Visible"}</span>
                      <span className="flex-1" />
                      <Link href={`/admin/lessons?course=${course.slug}`} className="grid h-8 w-8 place-items-center rounded-full bg-[var(--mint)] text-[var(--deep)]" aria-label={`Lessons for ${course.title}`} title="Lessons & files"><Clapperboard size={14} /></Link>
                      <Button size="sm" variant="ghost" onClick={() => setEditing(course)}><Pencil size={13} /> Edit</Button>
                    </div>
                  </div>
                </motion.article>
              );
            })}
          </AnimatePresence>
        </motion.div>
      ) : <Empty>No courses match these filters.</Empty>}

      <Drawer open={!!editing} onClose={() => setEditing(null)} title={editing ? `Edit · ${editing.title}` : ""}>
        {editing && (
          <CourseForm
            key={editing.slug}
            disabled={!editable}
            submitLabel="Save changes"
            initial={{ title: editing.title, subjectSlug: editing.subjectSlug, price: String(editing.price), instructor: editing.instructor, description: editing.description, cover: editing.cover }}
            onSubmit={async (draft) => {
              const ok = await act("course.update", { slug: editing.slug, patch: { ...draft, price: Number(draft.price) } }, "Course updated");
              if (ok) setEditing(null);
              return ok;
            }}
          />
        )}
      </Drawer>

      <Drawer open={creating} onClose={() => setCreating(false)} title="New course">
        <p className="mb-4 rounded-2xl bg-orange-50 p-3 text-xs text-orange-900">New courses start hidden. Add lessons, then switch them to live.</p>
        <CourseForm
          disabled={!editable}
          submitLabel="Create course"
          initial={{ title: "", subjectSlug: subject === "all" ? state.subjects[0].slug : subject, price: "29", instructor: "", description: "", cover: "" }}
          onSubmit={async (draft) => {
            const ok = await act("course.create", { ...draft, price: Number(draft.price) }, "Course created (hidden)");
            if (ok) setCreating(false);
            return ok;
          }}
        />
      </Drawer>
    </>
  );
}
