import { randomUUID } from "node:crypto";
import { readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";

import type {
  AccessChange, AuditEntry, CourseOverride, LessonPatch, Order, OrderStatus, PaymentMethod, PlanKind, SiteSettings,
} from "@/lib/admin-types";
import type { Course, Lesson } from "@/lib/catalog";
import { courses as baseCourses } from "@/lib/catalog";

// Local JSON storage for the admin area, next to users.json.
// Like users.json it suits one local Node process; replace with a database for deployment.
export type AdminData = {
  schemaVersion: 1;
  site: SiteSettings;
  courseOverrides: Record<string, CourseOverride>;
  customCourses: Course[];
  lessons: Record<string, {
    order?: Record<string, string[]>;
    patches?: Record<string, LessonPatch>;
    added?: { section: number; lesson: Lesson }[];
  }>;
  orders: Order[];
  accessLog: AccessChange[];
  audit: AuditEntry[];
};

const dataPath = path.join(process.cwd(), "TestData", "admin.json");
const state = globalThis as typeof globalThis & { siTutorAdminWrites?: Promise<unknown> };

const defaultSite: SiteSettings = {
  name: "SI Tutor",
  tagline: "Super Intelligence Tutor · Learn Beyond Limits.",
  supportEmail: "support@si-tutor.example",
  currency: "AUD",
  accessMonths: 3,
  announcement: "",
};

/* ── Seed: example orders so the dashboard has something to show on first run ── */

function seededRandom(seed: number) {
  let value = seed;
  return () => {
    value = (value * 1664525 + 1013904223) % 4294967296;
    return value / 4294967296;
  };
}

const demoStudents = [
  ["Alex Morgan", "student@si-tutor.example", "demo-student"],
  ["Maya Chen", "maya@si-tutor.example", "demo-university"],
  ["Narin Sukjai", "narin@si-tutor.example", "demo-ielts"],
  ["Liam Nguyen", "liam.nguyen@example.com"], ["Ava Patel", "ava.patel@example.com"], ["Noah Williams", "noah.w@example.com"],
  ["Mia Thompson", "mia.t@example.com"], ["Ethan Brown", "ethan.b@example.com"], ["Isla Wilson", "isla.w@example.com"],
  ["Lucas Martin", "lucas.m@example.com"], ["Chloe Lee", "chloe.lee@example.com"], ["Ploy Srisuk", "ploy.s@example.com"],
  ["Arjun Rao", "arjun.rao@example.com"], ["Sophie Taylor", "sophie.t@example.com"], ["Daniel Kim", "daniel.kim@example.com"],
  ["Hannah Brooks", "hannah.b@example.com"], ["Ken Watanabe", "ken.w@example.com"], ["Zoe Harris", "zoe.h@example.com"],
  // A wider pool of one-off buyers so repeat-purchase rates look realistic.
  ...["Olivia", "Jack", "Grace", "Leo", "Ruby", "Henry", "Ella", "Oscar", "Aria", "Max", "Ivy", "Theo", "Nina", "Sam", "Lily", "Kai",
    "Mila", "Finn", "Emma", "Ryan", "Anya", "Tom", "Sara", "Ben", "Pim", "Nat", "Bao", "Lina", "Omar", "Jade"].map((first, index) => {
    const last = ["Reid", "Clarke", "Singh", "Park", "Evans", "Wong", "Ali", "Moore", "Tran", "Hill"][index % 10];
    return [`${first} ${last}`, `${first.toLowerCase()}.${last.toLowerCase()}@example.com`] as const;
  }),
] as const;

function seedOrders(): Order[] {
  const random = seededRandom(20261119);
  const pick = <T,>(items: readonly T[]) => items[Math.floor(random() * items.length)];
  const methods: PaymentMethod[] = ["Stripe", "Stripe", "Stripe", "PayPal", "PayPal", "Afterpay"];
  const now = Date.now();
  const orders: Order[] = [];
  for (let index = 0; index < 150; index++) {
    // More recent days get more orders, so the trend rises.
    const daysAgo = Math.floor(Math.pow(random(), 1.35) * 120);
    const createdAt = new Date(now - daysAgo * 86_400_000 - Math.floor(random() * 86_400_000)).toISOString();
    const [name, email, studentId] = pick(demoStudents) as readonly [string, string, string?];
    const roll = random();
    const plan: PlanKind = roll < 0.68 ? "single" : roll < 0.9 ? "bundle" : "all-access";
    let items: Order["items"];
    let total: number;
    if (plan === "single") {
      const course = pick(baseCourses);
      items = [{ slug: course.slug, title: course.title, price: course.price }];
      total = course.price;
    } else if (plan === "bundle") {
      const chosen = new Set<string>();
      while (chosen.size < 3) chosen.add(pick(baseCourses).slug);
      items = [...chosen].map((slug) => {
        const course = baseCourses.find((item) => item.slug === slug)!;
        return { slug, title: course.title, price: 23 };
      });
      total = 69;
    } else {
      items = [{ slug: "plan:all-access", title: "All-Access Pass", price: 149 }];
      total = 149;
    }
    const method = pick(methods);
    const statusRoll = random();
    const status: OrderStatus = daysAgo < 4 && method === "Afterpay" ? "pending"
      : statusRoll < 0.035 ? "refund_requested" : statusRoll < 0.06 ? "refunded" : statusRoll < 0.075 ? "failed" : "paid";
    orders.push({
      id: "", createdAt, studentId, studentName: name, studentEmail: email, plan, items, total, method, status,
      ...(status === "refund_requested" ? { note: pick(["Bought the wrong course", "Duplicate purchase", "Course not what I expected"]) } : {}),
      demo: true,
    });
  }
  orders.sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  orders.forEach((order, index) => { order.id = `SI-${10240 + index}`; });
  // A couple of fresh payments waiting for review.
  const latest = orders.slice(-6);
  latest[1].status = "pending";
  latest[1].method = "Afterpay";
  latest[4].status = "pending";
  latest[4].method = "PayPal";
  return orders.reverse();
}

function freshData(): AdminData {
  return {
    schemaVersion: 1,
    site: defaultSite,
    courseOverrides: {},
    customCourses: [],
    lessons: {},
    orders: seedOrders(),
    accessLog: [],
    audit: [],
  };
}

export async function readAdminData(): Promise<AdminData> {
  try {
    const data = JSON.parse(await readFile(dataPath, "utf8")) as AdminData;
    return { ...freshData(), ...data, site: { ...defaultSite, ...data.site } };
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
    const data = freshData();
    await save(data);
    return data;
  }
}

async function save(data: AdminData) {
  const temporaryPath = `${dataPath}.tmp`;
  await writeFile(temporaryPath, JSON.stringify(data, null, 2) + "\n", "utf8");
  await rename(temporaryPath, dataPath);
}

/** Serialised read-modify-write so concurrent requests cannot lose changes. */
export function updateAdminData<T>(change: (data: AdminData) => T | Promise<T>) {
  const operation = (state.siTutorAdminWrites ?? Promise.resolve()).then(async () => {
    const data = await readAdminData();
    const result = await change(data);
    await save(data);
    return result;
  });
  state.siTutorAdminWrites = operation.catch(() => undefined);
  return operation;
}

export function newId() {
  return randomUUID();
}

export function nextOrderId(orders: Order[]) {
  const highest = orders.reduce((max, order) => Math.max(max, Number(order.id.replace(/\D/g, "")) || 0), 10240);
  return `SI-${highest + 1}`;
}
