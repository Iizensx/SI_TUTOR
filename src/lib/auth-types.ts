export type StudentLevel = "High school" | "University" | "Lifelong learner";

export type UserProfile = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: "student";
  level: StudentLevel;
  country: string;
  learningGoal: string;
  interests: string[];
  createdAt: string;
  enrollments: { courseSlug: string; expiresAt: string }[];
};

export function safeAuthNext(next: unknown) {
  return typeof next === "string" && /^\/(?:subjects(?:\/[a-z0-9-]+)?|my-courses|courses\/[a-z0-9-]+(?:\/(?:checkout|learn))?)$/.test(next)
    ? next : "/my-courses";
}
