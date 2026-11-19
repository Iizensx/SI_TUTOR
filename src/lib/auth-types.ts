export type AdminRole = "owner" | "editor" | "support";

export type StudentLevel = "High school" | "University" | "Lifelong learner";

export type UserProfile = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  avatar?: "blue" | "violet" | "green" | "amber";
  role: "student" | "admin";
  /** Only for admins: owner (everything), editor (catalog & lessons), support (orders & student access). */
  adminRole?: AdminRole;
  level: StudentLevel;
  country: string;
  learningGoal: string;
  interests: string[];
  createdAt: string;
  enrollments: { courseSlug: string; expiresAt: string }[];
};

export function safeAuthNext(next: unknown) {
  return typeof next === "string" && (next === "/" || /^\/(?:subjects(?:\/[a-z0-9-]+)?|my-courses|my-account|admin(?:\/(?:courses|lessons|orders|students|reports|settings))?|pricing(?:\/checkout\/(?:bundle|all-access))?|courses\/[a-z0-9-]+(?:\/(?:checkout|learn))?)$/.test(next))
    ? next : "/my-courses";
}
