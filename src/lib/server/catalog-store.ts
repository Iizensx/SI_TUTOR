import type { AdminCourse } from "@/lib/admin-types";
import { courses as baseCourses, subjects, type Course, type Lesson } from "@/lib/catalog";
import { readAdminData, type AdminData } from "./admin-store";

function minutes(duration: string) {
  const [m = "0", s = "0"] = duration.split(":");
  return (Number(m) || 0) + (Number(s) || 0) / 60;
}

function formatTotal(totalMinutes: number) {
  if (totalMinutes < 60) return `${Math.max(1, Math.round(totalMinutes))}m`;
  const hours = Math.floor(totalMinutes / 60);
  const rest = Math.round(totalMinutes % 60);
  return rest ? `${hours}h ${rest}m` : `${hours}h`;
}

function applyLessons(course: Course, data: AdminData): Course {
  const edits = data.lessons[course.slug];
  if (!edits) return course;
  const sections = course.sections.map((section, sectionIndex) => {
    let lessons: Lesson[] = [
      ...section.lessons,
      ...(edits.added ?? []).filter((item) => item.section === sectionIndex).map((item) => item.lesson),
    ];
    lessons = lessons.map((lesson) => {
      const patch = edits.patches?.[lesson.id];
      if (!patch) return lesson;
      return {
        ...lesson,
        ...(patch.preview !== undefined ? { preview: patch.preview } : {}),
        ...(patch.files ? { files: patch.files } : {}),
        ...(patch.video !== undefined ? { video: patch.video ? { source: patch.video, captions: "" } : undefined } : {}),
      };
    });
    const order = edits.order?.[String(sectionIndex)];
    if (order) {
      lessons.sort((a, b) => {
        const ai = order.indexOf(a.id);
        const bi = order.indexOf(b.id);
        return (ai === -1 ? 999 : ai) - (bi === -1 ? 999 : bi);
      });
    }
    return { ...section, lessons };
  });
  const all = sections.flatMap((section) => section.lessons);
  const changed = (edits.added?.length ?? 0) > 0;
  return {
    ...course,
    sections,
    lessonCount: all.length,
    duration: changed ? formatTotal(all.reduce((sum, lesson) => sum + minutes(lesson.duration), 0)) : course.duration,
  };
}

/** Every course with admin edits applied, including hidden and admin-created ones. */
export async function getAdminCourses(data?: AdminData): Promise<AdminCourse[]> {
  const store = data ?? await readAdminData();
  const custom = new Set(store.customCourses.map((course) => course.slug));
  return [...baseCourses, ...store.customCourses].map((course) => {
    const override = store.courseOverrides[course.slug] ?? {};
    const { hidden = false, ...fields } = override;
    return { ...applyLessons({ ...course, ...fields }, store), hidden, custom: custom.has(course.slug) };
  });
}

/** Courses visitors can see (hidden ones removed). */
export async function getPublicCourses(): Promise<Course[]> {
  return (await getAdminCourses()).filter((course) => !course.hidden).map(({ hidden, custom, ...course }) => {
    void hidden;
    void custom;
    return course;
  });
}

export async function getPublicCourse(slug: string) {
  return (await getPublicCourses()).find((course) => course.slug === slug);
}

export async function getSite() {
  return (await readAdminData()).site;
}

export { subjects };
