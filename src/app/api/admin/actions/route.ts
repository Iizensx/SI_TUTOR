import { NextRequest, NextResponse } from "next/server";

import { allAccessSlug, type CourseOverride, type LessonFile, type OrderStatus, type SiteSettings } from "@/lib/admin-types";
import type { AdminRole, UserProfile } from "@/lib/auth-types";
import { subjects, type Course } from "@/lib/catalog";
import { AdminAccessError, requireAdmin } from "@/lib/server/admin-auth";
import { newId, updateAdminData, type AdminData } from "@/lib/server/admin-store";
import { getAdminCourses } from "@/lib/server/catalog-store";
import { AuthError, findUser, setAdminRole, setEnrollment } from "@/lib/server/user-repository";
import { buildAdminState } from "../state";

export const runtime = "nodejs";

type Payload = Record<string, unknown>;
type Admin = UserProfile & { adminRole: AdminRole };

class ActionError extends Error {}

const text = (value: unknown, max = 500) => (typeof value === "string" ? value.trim().slice(0, max) : "");
const catalogRoles: AdminRole[] = ["owner", "editor"];
const salesRoles: AdminRole[] = ["owner", "support"];
const slugify = (value: string) => value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 60);
const safeUrl = (value: string) => value === "" || value.startsWith("/") || /^https:\/\//.test(value);

function audit(data: AdminData, admin: Admin, action: string, target: string, detail?: string) {
  data.audit.unshift({
    id: newId(), at: new Date().toISOString(), by: `${admin.firstName} ${admin.lastName} <${admin.email}>`,
    role: admin.adminRole, action, target, ...(detail ? { detail } : {}),
  });
  data.audit = data.audit.slice(0, 1000);
}

async function findCourse(data: AdminData, slug: string) {
  const course = (await getAdminCourses(data)).find((item) => item.slug === slug);
  if (!course) throw new ActionError("Course not found.");
  return course;
}

function cleanFiles(value: unknown): LessonFile[] {
  if (!Array.isArray(value)) return [];
  return value.slice(0, 20).map((file) => ({ name: text((file as Payload)?.name, 120), url: text((file as Payload)?.url, 500) }))
    .filter((file) => file.name && file.url && safeUrl(file.url));
}

async function run(type: string, payload: Payload, admin: Admin) {
  const guard = async (roles: AdminRole[]) => { await requireRole(admin, roles); };

  switch (type) {
    case "site.update": {
      await guard(["owner"]);
      const site = payload.site as Partial<SiteSettings>;
      return updateAdminData((data) => {
        data.site = {
          name: text(site.name, 60) || data.site.name,
          tagline: text(site.tagline, 120),
          supportEmail: text(site.supportEmail, 120),
          currency: text(site.currency, 6) || "AUD",
          accessMonths: Math.min(24, Math.max(1, Number(site.accessMonths) || 3)),
          announcement: text(site.announcement, 200),
        };
        audit(data, admin, "Updated site settings", "Site");
      });
    }

    case "course.update": {
      await guard(catalogRoles);
      const slug = text(payload.slug, 80);
      const patch = payload.patch as Payload;
      return updateAdminData(async (data) => {
        const course = await findCourse(data, slug);
        const next: CourseOverride = { ...(data.courseOverrides[slug] ?? {}) };
        const changes: string[] = [];
        if (patch.title !== undefined) { const v = text(patch.title, 120); if (!v) throw new ActionError("Title is required."); next.title = v; changes.push("title"); }
        if (patch.description !== undefined) { next.description = text(patch.description, 600); changes.push("description"); }
        if (patch.instructor !== undefined) { next.instructor = text(patch.instructor, 80) || "SI Tutor Team"; changes.push("instructor"); }
        if (patch.cover !== undefined) { const v = text(patch.cover, 500); if (!safeUrl(v)) throw new ActionError("Cover must be an uploaded file or an https:// link."); next.cover = v || course.cover; changes.push("cover"); }
        if (patch.price !== undefined) { const v = Number(patch.price); if (!Number.isFinite(v) || v < 0 || v > 5000) throw new ActionError("Enter a price between 0 and 5000."); next.price = Math.round(v * 100) / 100; changes.push(`price ${course.price} → ${next.price}`); }
        if (patch.subjectSlug !== undefined) { const v = text(patch.subjectSlug, 40); if (!subjects.some((s) => s.slug === v)) throw new ActionError("Choose a valid category."); next.subjectSlug = v; changes.push("category"); }
        if (patch.hidden !== undefined) { next.hidden = Boolean(patch.hidden); changes.push(next.hidden ? "hidden" : "visible"); }
        data.courseOverrides[slug] = next;
        audit(data, admin, patch.hidden !== undefined && changes.length === 1 ? (next.hidden ? "Hid course" : "Published course") : "Edited course", course.title, changes.join(", "));
      });
    }

    case "course.create": {
      await guard(catalogRoles);
      const title = text(payload.title, 120);
      const subjectSlug = text(payload.subjectSlug, 40);
      const price = Number(payload.price);
      if (!title) throw new ActionError("Title is required.");
      if (!subjects.some((s) => s.slug === subjectSlug)) throw new ActionError("Choose a category.");
      if (!Number.isFinite(price) || price < 0) throw new ActionError("Enter a valid price.");
      const cover = text(payload.cover, 500);
      if (!safeUrl(cover)) throw new ActionError("Cover must be an uploaded file or an https:// link.");
      return updateAdminData(async (data) => {
        const all = await getAdminCourses(data);
        let slug = slugify(title) || "course";
        while (all.some((course) => course.slug === slug)) slug = `${slug}-${Math.floor(Math.random() * 900 + 100)}`;
        const course: Course = {
          slug, subjectSlug, title, price,
          description: text(payload.description, 600),
          cover: cover || subjects.find((s) => s.slug === subjectSlug)!.image,
          instructor: text(payload.instructor, 80) || "SI Tutor Team",
          rating: 0, reviews: "0", duration: "0m", lessonCount: 0,
          outcomes: [], sections: [{ title: "Getting Started", lessons: [] }],
        };
        data.customCourses.push(course);
        // New courses start hidden so they can be prepared before going live.
        data.courseOverrides[slug] = { hidden: true };
        audit(data, admin, "Created course", title, "Starts hidden");
        return slug;
      });
    }

    case "lessons.reorder": {
      await guard(catalogRoles);
      const slug = text(payload.slug, 80);
      const section = Number(payload.section);
      const order = Array.isArray(payload.order) ? payload.order.map((id) => text(id, 80)).filter(Boolean) : [];
      return updateAdminData(async (data) => {
        const course = await findCourse(data, slug);
        if (!course.sections[section]) throw new ActionError("Section not found.");
        data.lessons[slug] = { ...(data.lessons[slug] ?? {}) };
        data.lessons[slug].order = { ...(data.lessons[slug].order ?? {}), [String(section)]: order };
        audit(data, admin, "Reordered lessons", course.title, course.sections[section].title);
      });
    }

    case "lesson.update": {
      await guard(catalogRoles);
      const slug = text(payload.slug, 80);
      const lessonId = text(payload.lessonId, 80);
      const patch = payload.patch as Payload;
      return updateAdminData(async (data) => {
        const course = await findCourse(data, slug);
        const lesson = course.sections.flatMap((s) => s.lessons).find((item) => item.id === lessonId);
        if (!lesson) throw new ActionError("Lesson not found.");
        const entry = { ...(data.lessons[slug] ?? {}) };
        const current = { ...(entry.patches?.[lessonId] ?? {}) };
        const changes: string[] = [];
        if (patch.preview !== undefined) { current.preview = Boolean(patch.preview); changes.push(current.preview ? "preview on" : "preview off"); }
        if (patch.video !== undefined) { const v = text(patch.video, 500); if (!safeUrl(v)) throw new ActionError("Video must be an uploaded file or an https:// link."); current.video = v; changes.push(v ? "video set" : "video removed"); }
        if (patch.files !== undefined) { current.files = cleanFiles(patch.files); changes.push(`${current.files.length} file(s)`); }
        entry.patches = { ...(entry.patches ?? {}), [lessonId]: current };
        data.lessons[slug] = entry;
        audit(data, admin, "Edited lesson", `${course.title} › ${lesson.title}`, changes.join(", "));
      });
    }

    case "lesson.add": {
      await guard(catalogRoles);
      const slug = text(payload.slug, 80);
      const section = Number(payload.section);
      const title = text(payload.title, 120);
      const duration = /^\d{1,3}:\d{2}$/.test(text(payload.duration, 6)) ? text(payload.duration, 6) : "10:00";
      if (!title) throw new ActionError("Lesson title is required.");
      return updateAdminData(async (data) => {
        const course = await findCourse(data, slug);
        if (!course.sections[section]) throw new ActionError("Section not found.");
        const id = `${slugify(title) || "lesson"}-${newId().slice(0, 6)}`;
        const video = text(payload.video, 500);
        if (!safeUrl(video)) throw new ActionError("Video must be an uploaded file or an https:// link.");
        const entry = { ...(data.lessons[slug] ?? {}) };
        entry.added = [...(entry.added ?? []), {
          section,
          lesson: { id, title, duration, description: text(payload.description, 600), takeaways: [], ...(video ? { video: { source: video, captions: "" } } : {}) },
        }];
        data.lessons[slug] = entry;
        audit(data, admin, "Added lesson", `${course.title} › ${title}`);
      });
    }

    case "order.status": {
      await guard(salesRoles);
      const id = text(payload.id, 40);
      const status = text(payload.status, 30) as OrderStatus;
      const reason = text(payload.reason, 300);
      const revoke = Boolean(payload.revokeAccess);
      if (!["paid", "refunded", "failed"].includes(status)) throw new ActionError("Unsupported status.");
      if ((status === "refunded" || status === "failed") && !reason) throw new ActionError("Add a reason for the record.");
      const order = await updateAdminData((data) => {
        const found = data.orders.find((item) => item.id === id);
        if (!found) throw new ActionError("Order not found.");
        const before = found.status;
        found.status = status;
        if (reason) found.note = reason;
        audit(data, admin, status === "refunded" ? "Refunded order" : status === "failed" ? "Marked payment failed" : "Confirmed payment", id, `${before} → ${status}${reason ? ` · ${reason}` : ""}`);
        return { ...found };
      });
      if (revoke && order.studentId && (status === "refunded" || status === "failed")) {
        const now = new Date().toISOString();
        for (const item of order.items) await setEnrollment(order.studentId, item.slug, now);
      }
      return;
    }

    case "access.adjust": {
      await guard(salesRoles);
      const userId = text(payload.userId, 80);
      const courseSlug = text(payload.courseSlug, 80);
      const action = text(payload.action, 20);
      const reason = text(payload.reason, 300);
      if (!reason) throw new ActionError("A reason is required for every access change.");
      const student = await findUser(userId);
      if (!student) throw new ActionError("Student not found.");
      if (courseSlug !== allAccessSlug && !(await getAdminCourses()).some((course) => course.slug === courseSlug)) {
        throw new ActionError("Course not found.");
      }
      const current = student.enrollments.find((item) => item.courseSlug === courseSlug)?.expiresAt ?? null;
      let after: string | null;
      if (action === "extend") {
        const days = Math.min(365, Math.max(1, Number(payload.days) || 30));
        const base = Math.max(Date.now(), current ? Date.parse(current) : 0);
        after = new Date(base + days * 86_400_000).toISOString();
      } else if (action === "set") {
        const date = Date.parse(text(payload.expiresAt, 40));
        if (!Number.isFinite(date)) throw new ActionError("Choose a valid end date.");
        after = new Date(date).toISOString();
      } else if (action === "grant") {
        const months = Math.min(24, Math.max(1, Number(payload.months) || 3));
        const date = new Date();
        date.setMonth(date.getMonth() + months);
        after = date.toISOString();
      } else if (action === "revoke") {
        after = new Date().toISOString();
      } else {
        throw new ActionError("Unknown access action.");
      }
      await setEnrollment(userId, courseSlug, after);
      return updateAdminData((data) => {
        const name = `${student.firstName} ${student.lastName}`;
        data.accessLog.unshift({ id: newId(), at: new Date().toISOString(), by: `${admin.firstName} ${admin.lastName}`, userId, studentName: name, courseSlug, before: current, after, reason });
        audit(data, admin, `Access ${action}`, `${name} · ${courseSlug}`, reason);
      });
    }

    case "admin.set": {
      await guard(["owner"]);
      const email = text(payload.email, 254).toLowerCase();
      const role = payload.adminRole === null ? null : text(payload.adminRole, 20) as AdminRole;
      if (role !== null && !["owner", "editor", "support"].includes(role)) throw new ActionError("Choose a role.");
      if (email === admin.email.toLowerCase() && role !== "owner") throw new ActionError("You cannot remove your own owner access.");
      await setAdminRole(email, role);
      return updateAdminData((data) => audit(data, admin, role ? `Set admin role: ${role}` : "Removed admin access", email));
    }

    default:
      throw new ActionError("Unknown action.");
  }
}

async function requireRole(admin: Admin, roles: AdminRole[]) {
  if (!roles.includes(admin.adminRole)) throw new AdminAccessError(`Your role (${admin.adminRole}) cannot do this.`, 403);
}

export async function POST(request: NextRequest) {
  const origin = request.headers.get("origin");
  if (origin && origin !== request.nextUrl.origin) return NextResponse.json({ error: "This request is not allowed." }, { status: 403 });
  try {
    const admin = await requireAdmin(request);
    const body = await request.json() as Payload;
    const result = await run(text(body.type, 40), body, admin);
    const me = (await findUser(admin.id)) ?? admin;
    return NextResponse.json({ result: result ?? null, state: await buildAdminState(me) }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    if (error instanceof AdminAccessError) return NextResponse.json({ error: error.message }, { status: error.status });
    if (error instanceof ActionError || error instanceof AuthError) return NextResponse.json({ error: error.message }, { status: 400 });
    if (error instanceof SyntaxError) return NextResponse.json({ error: "Invalid data." }, { status: 400 });
    console.error(error);
    return NextResponse.json({ error: "Could not save the change. Please try again." }, { status: 500 });
  }
}
