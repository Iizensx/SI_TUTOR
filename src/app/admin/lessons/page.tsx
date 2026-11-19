"use client";

import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useMemo, useState, type FormEvent } from "react";
import { Reorder, useDragControls } from "framer-motion";
import { FileText, GripVertical, Link2, Paperclip, Plus, Trash2, Upload, Video } from "lucide-react";

import type { Lesson } from "@/lib/catalog";
import type { LessonFile } from "@/lib/admin-types";
import { useAdmin } from "../_lib/admin-context";
import { Button, Card, Drawer, Empty, Field, inputClass, PageTitle, Pill, Switch, textareaClass } from "../_components/ui";

function UploadButton({ accept, onUploaded, label, disabled }: { accept: string; onUploaded: (file: { url: string; name: string }) => void; label: string; disabled?: boolean }) {
  const { upload } = useAdmin();
  return (
    <label className={`inline-flex h-10 flex-none cursor-pointer items-center gap-2 rounded-full bg-[var(--deep)] px-4 text-sm font-semibold text-white ${disabled ? "pointer-events-none opacity-40" : ""}`}>
      <Upload size={15} /> {label}
      <input type="file" accept={accept} className="sr-only" disabled={disabled} onChange={async (event) => {
        const file = event.target.files?.[0];
        if (!file) return;
        const result = await upload(file);
        if (result) onUploaded(result);
        event.target.value = "";
      }} />
    </label>
  );
}

function LessonRow({ lesson, index, editable, onEdit, onTogglePreview, onDragEnd }: {
  lesson: Lesson; index: number; editable: boolean; onEdit: () => void; onTogglePreview: (value: boolean) => void; onDragEnd: () => void;
}) {
  const controls = useDragControls();
  return (
    <Reorder.Item
      value={lesson}
      dragListener={false}
      dragControls={controls}
      onDragEnd={onDragEnd}
      className="flex items-center gap-3 rounded-2xl bg-white/85 p-3 ring-1 ring-[var(--line)]"
      whileDrag={{ scale: 1.02, boxShadow: "0 24px 40px -24px #17332f" }}
    >
      <button
        type="button"
        aria-label={`Drag to reorder ${lesson.title}`}
        className={`grid h-9 w-7 flex-none touch-none place-items-center rounded-lg text-[var(--muted)] ${editable ? "cursor-grab hover:bg-[var(--mint)] active:cursor-grabbing" : "cursor-not-allowed opacity-40"}`}
        onPointerDown={(event) => { if (editable) controls.start(event); }}
      >
        <GripVertical size={16} />
      </button>
      <span className="grid h-9 w-9 flex-none place-items-center rounded-xl bg-[var(--mint)] text-xs font-bold text-[var(--deep)]">{String(index + 1).padStart(2, "0")}</span>
      <span className="min-w-0 flex-1">
        <strong className="block truncate text-sm">{lesson.title}</strong>
        <span className="mt-1 flex flex-wrap items-center gap-1.5 text-[11px] text-[var(--muted)]">
          {lesson.duration}
          {lesson.video ? <Pill tone="mint"><Video size={11} /> Video</Pill> : <Pill tone="slate">No video</Pill>}
          {(lesson.files?.length ?? 0) > 0 && <Pill tone="accent"><Paperclip size={11} /> {lesson.files!.length}</Pill>}
          {lesson.preview && <Pill tone="dark">Preview</Pill>}
        </span>
      </span>
      <span className="hidden items-center gap-2 text-xs text-[var(--muted)] sm:flex">
        Preview <Switch checked={!!lesson.preview} onChange={onTogglePreview} label={`Preview lesson: ${lesson.title}`} disabled={!editable} />
      </span>
      <Button size="sm" variant="ghost" onClick={onEdit}>Edit</Button>
    </Reorder.Item>
  );
}

function SectionList({ slug, sectionIndex, title, lessons: initial, editable, onEdit }: {
  slug: string; sectionIndex: number; title: string; lessons: Lesson[]; editable: boolean; onEdit: (lesson: Lesson) => void;
}) {
  const { act } = useAdmin();
  const [lessons, setLessons] = useState(initial);
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState({ title: "", duration: "10:00", description: "", video: "" });
  const key = initial.map((lesson) => lesson.id + (lesson.preview ? "p" : "") + (lesson.video?.source ?? "") + (lesson.files?.length ?? 0)).join("|");
  // Keep local order in sync when the server sends new data.
  useEffect(() => { setLessons(initial); }, [key]); // eslint-disable-line react-hooks/exhaustive-deps, react-hooks/set-state-in-effect

  const saveOrder = () => {
    const order = lessons.map((lesson) => lesson.id);
    if (order.join() !== initial.map((lesson) => lesson.id).join()) void act("lessons.reorder", { slug, section: sectionIndex, order }, "Lesson order saved");
  };

  async function add(event: FormEvent) {
    event.preventDefault();
    const ok = await act("lesson.add", { slug, section: sectionIndex, ...draft }, "Lesson added");
    if (ok) { setDraft({ title: "", duration: "10:00", description: "", video: "" }); setAdding(false); }
  }

  return (
    <Card className="!p-4">
      <div className="mb-3 flex items-center justify-between gap-2 px-1">
        <h3 className="font-semibold">{title} <span className="text-sm font-normal text-[var(--muted)]">· {lessons.length} lessons</span></h3>
        <Button size="sm" variant="light" onClick={() => setAdding(!adding)} disabled={!editable}><Plus size={13} /> Add lesson</Button>
      </div>
      {adding && (
        <form onSubmit={add} className="mb-3 grid gap-3 rounded-2xl bg-white/70 p-3 ring-1 ring-[var(--line)] sm:grid-cols-[1fr_110px]">
          <input className={inputClass} required placeholder="Lesson title" value={draft.title} onChange={(event) => setDraft({ ...draft, title: event.target.value })} />
          <input className={inputClass} placeholder="mm:ss" pattern="\d{1,3}:\d{2}" value={draft.duration} onChange={(event) => setDraft({ ...draft, duration: event.target.value })} aria-label="Duration" />
          <input className={`${inputClass} sm:col-span-2`} placeholder="Video link (YouTube, Vimeo, MP4) — optional" value={draft.video} onChange={(event) => setDraft({ ...draft, video: event.target.value })} />
          <textarea className={`${textareaClass} sm:col-span-2`} placeholder="Short description" value={draft.description} onChange={(event) => setDraft({ ...draft, description: event.target.value })} />
          <div className="flex gap-2 sm:col-span-2"><Button type="submit" variant="dark">Add lesson</Button><Button variant="ghost" onClick={() => setAdding(false)}>Cancel</Button></div>
        </form>
      )}
      {lessons.length ? (
        <Reorder.Group axis="y" values={lessons} onReorder={editable ? setLessons : () => undefined} className="grid grid-cols-1 gap-2">
          {lessons.map((lesson, index) => (
            <LessonRow
              key={lesson.id}
              lesson={lesson}
              index={index}
              editable={editable}
              onEdit={() => onEdit(lesson)}
              onDragEnd={saveOrder}
              onTogglePreview={(value) => act("lesson.update", { slug, lessonId: lesson.id, patch: { preview: value } }, value ? "Preview turned on" : "Preview turned off")}
            />
          ))}
        </Reorder.Group>
      ) : <Empty>No lessons yet. Add the first one.</Empty>}
    </Card>
  );
}

function LessonEditor({ slug, lesson, editable, onDone }: { slug: string; lesson: Lesson; editable: boolean; onDone: () => void }) {
  const { act } = useAdmin();
  const [video, setVideo] = useState(lesson.video?.source ?? "");
  const [files, setFiles] = useState<LessonFile[]>(lesson.files ?? []);
  const [link, setLink] = useState({ name: "", url: "" });
  const [preview, setPreview] = useState(!!lesson.preview);
  return (
    <div className="grid gap-5">
      <Field label="Lesson video" hint="Upload an MP4/WebM/MOV, or paste a YouTube, Vimeo or https:// video link.">
        <div className="flex gap-2">
          <input className={inputClass} value={video} onChange={(event) => setVideo(event.target.value)} placeholder="https://youtu.be/… or /uploads/…" disabled={!editable} />
          <UploadButton accept="video/mp4,video/webm,video/quicktime" label="Upload" onUploaded={(file) => setVideo(file.url)} disabled={!editable} />
        </div>
      </Field>
      {video && /\.(mp4|webm|mov)$/i.test(video) && <video className="w-full rounded-2xl bg-black" src={video} controls preload="metadata" />}

      <div>
        <p className="mb-2 text-sm font-semibold">Study files</p>
        <ul className="grid grid-cols-1 gap-2">
          {files.map((file, index) => (
            <li key={file.url + index} className="flex items-center gap-3 rounded-2xl bg-white p-3 ring-1 ring-[var(--line)]">
              <FileText size={16} className="text-[var(--deep)]" />
              <a href={file.url} target="_blank" rel="noreferrer" className="min-w-0 flex-1 truncate text-sm font-medium underline-offset-2 hover:underline">{file.name}</a>
              <button type="button" disabled={!editable} onClick={() => setFiles(files.filter((_, i) => i !== index))} aria-label={`Remove ${file.name}`} className="grid h-8 w-8 place-items-center rounded-full text-rose-600 hover:bg-rose-50 disabled:opacity-40"><Trash2 size={14} /></button>
            </li>
          ))}
          {!files.length && <li className="text-sm text-[var(--muted)]">No files attached.</li>}
        </ul>
        <div className="mt-3 grid grid-cols-1 gap-2 rounded-2xl bg-white/70 p-3 ring-1 ring-[var(--line)]">
          <div className="flex flex-wrap gap-2">
            <UploadButton accept=".pdf,.docx,.pptx,.zip,.txt,image/*" label="Upload file" onUploaded={(file) => setFiles([...files, { name: file.name, url: file.url }])} disabled={!editable} />
          </div>
          <p className="text-xs text-[var(--muted)]">…or attach a link</p>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-[1fr_1.4fr_auto]">
            <input className={inputClass} placeholder="File name" value={link.name} onChange={(event) => setLink({ ...link, name: event.target.value })} disabled={!editable} />
            <input className={inputClass} placeholder="https://…" value={link.url} onChange={(event) => setLink({ ...link, url: event.target.value })} disabled={!editable} />
            <Button variant="light" disabled={!editable || !link.name || !/^https:\/\//.test(link.url)} onClick={() => { setFiles([...files, link]); setLink({ name: "", url: "" }); }}><Link2 size={14} /> Add</Button>
          </div>
        </div>
      </div>

      <label className="flex items-center justify-between rounded-2xl bg-white p-4 ring-1 ring-[var(--line)]">
        <span><strong className="block text-sm">Free preview</strong><span className="text-xs text-[var(--muted)]">Visitors can watch this lesson before buying.</span></span>
        <Switch checked={preview} onChange={setPreview} label="Free preview" disabled={!editable} />
      </label>

      <Button variant="dark" disabled={!editable} onClick={async () => {
        const ok = await act("lesson.update", { slug, lessonId: lesson.id, patch: { video, files, preview } }, "Lesson saved");
        if (ok) onDone();
      }}>Save lesson</Button>
      {!editable && <p className="text-xs text-[var(--muted)]">Only owners and editors can change lessons.</p>}
    </div>
  );
}

function LessonsInner() {
  const { state, can } = useAdmin();
  const params = useSearchParams();
  const router = useRouter();
  const slug = params.get("course") ?? state?.courses[0]?.slug ?? "";
  const [editing, setEditing] = useState<Lesson | null>(null);
  const course = useMemo(() => state?.courses.find((item) => item.slug === slug), [state, slug]);
  if (!state) return null;
  const editable = can("catalog");

  return (
    <>
      <PageTitle title="Lessons &" accent="Files" subtitle="Drag lessons to reorder, add videos and study files, and choose which lessons are free previews." />
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[300px_minmax(0,1fr)]">
        <Card className="min-w-0 !p-3 lg:sticky lg:top-4 lg:max-h-[calc(100svh-120px)] lg:overflow-y-auto lg:overflow-x-hidden">
          <label className="mb-2 block px-2 pt-1 text-xs font-semibold uppercase tracking-[0.14em] text-[var(--muted)]" htmlFor="course-select">Course</label>
          <select id="course-select" className={`${inputClass} lg:hidden`} value={slug} onChange={(event) => router.replace(`/admin/lessons?course=${event.target.value}`)}>
            {state.courses.map((item) => <option key={item.slug} value={item.slug}>{item.title}</option>)}
          </select>
          <ul className="hidden min-w-0 gap-1 lg:grid">
            {state.courses.map((item) => (
              <li key={item.slug} className="min-w-0">
                <button type="button" onClick={() => router.replace(`/admin/lessons?course=${item.slug}`)} aria-current={item.slug === slug ? "true" : undefined}
                  className={`flex w-full items-center gap-2.5 rounded-2xl p-2 text-left text-sm transition ${item.slug === slug ? "bg-[var(--deep)] text-white" : "hover:bg-white"}`}>
                  <span className="relative h-9 w-9 flex-none overflow-hidden rounded-xl bg-white"><Image src={item.cover} alt="" fill sizes="36px" className="object-cover" unoptimized={item.cover.startsWith("http")} /></span>
                  <span className="min-w-0 flex-1"><span className="block truncate font-medium">{item.title}</span><span className={`text-[11px] ${item.slug === slug ? "text-white/70" : "text-[var(--muted)]"}`}>{item.lessonCount} lessons{item.hidden ? " · hidden" : ""}</span></span>
                </button>
              </li>
            ))}
          </ul>
        </Card>
        <div className="grid min-w-0 content-start gap-4">
          {course ? course.sections.map((section, index) => (
            <SectionList key={`${course.slug}-${index}`} slug={course.slug} sectionIndex={index} title={section.title} lessons={section.lessons} editable={editable} onEdit={setEditing} />
          )) : <Empty>Choose a course.</Empty>}
        </div>
      </div>
      <Drawer open={!!editing} onClose={() => setEditing(null)} title={editing ? editing.title : ""}>
        {editing && course && <LessonEditor key={editing.id} slug={course.slug} lesson={editing} editable={editable} onDone={() => setEditing(null)} />}
      </Drawer>
    </>
  );
}

export default function LessonsPage() {
  return <Suspense><LessonsInner /></Suspense>;
}
