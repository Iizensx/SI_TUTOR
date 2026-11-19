// Shared admin data types (used by the API and the admin UI).
import type { AdminRole, UserProfile } from "@/lib/auth-types";
import type { Course, Subject } from "@/lib/catalog";

export type PaymentMethod = "PayPal" | "Stripe" | "Afterpay";
export type OrderStatus = "paid" | "pending" | "refund_requested" | "refunded" | "failed";
export type PlanKind = "single" | "bundle" | "all-access";

export type Order = {
  id: string;
  createdAt: string;
  studentId?: string;
  studentName: string;
  studentEmail: string;
  plan: PlanKind;
  items: { slug: string; title: string; price: number }[];
  total: number;
  method: PaymentMethod;
  status: OrderStatus;
  note?: string;
  /** Seeded example data, not a real purchase. */
  demo?: boolean;
};

export type LessonFile = { name: string; url: string };

export type LessonPatch = { video?: string; preview?: boolean; files?: LessonFile[] };

export type CourseOverride = Partial<Pick<Course, "title" | "description" | "price" | "cover" | "instructor" | "subjectSlug">> & {
  hidden?: boolean;
};

export type SiteSettings = {
  name: string;
  tagline: string;
  supportEmail: string;
  currency: string;
  accessMonths: number;
  announcement: string;
};

export type AccessChange = {
  id: string;
  at: string;
  by: string;
  userId: string;
  studentName: string;
  courseSlug: string;
  before: string | null;
  after: string | null;
  reason: string;
};

export type AuditEntry = {
  id: string;
  at: string;
  by: string;
  role: AdminRole;
  action: string;
  target: string;
  detail?: string;
};

export type AdminCourse = Course & { hidden: boolean; custom: boolean };

export type AdminState = {
  me: UserProfile;
  site: SiteSettings;
  subjects: Subject[];
  courses: AdminCourse[];
  orders: Order[];
  students: UserProfile[];
  admins: UserProfile[];
  accessLog: AccessChange[];
  audit: AuditEntry[];
};

export const permissions: Record<AdminRole, { catalog: boolean; sales: boolean; team: boolean }> = {
  owner: { catalog: true, sales: true, team: true },
  editor: { catalog: true, sales: false, team: false },
  support: { catalog: false, sales: true, team: false },
};

export const allAccessSlug = "plan:all-access";
