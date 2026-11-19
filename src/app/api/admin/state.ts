import type { AdminState } from "@/lib/admin-types";
import type { UserProfile } from "@/lib/auth-types";
import { subjects } from "@/lib/catalog";
import { readAdminData } from "@/lib/server/admin-store";
import { getAdminCourses } from "@/lib/server/catalog-store";
import { listUsers } from "@/lib/server/user-repository";

export async function buildAdminState(me: UserProfile): Promise<AdminState> {
  const data = await readAdminData();
  const users = await listUsers();
  return {
    me,
    site: data.site,
    subjects,
    courses: await getAdminCourses(data),
    orders: data.orders,
    students: users.filter((user) => user.role !== "admin"),
    admins: users.filter((user) => user.role === "admin"),
    accessLog: data.accessLog.slice(0, 200),
    audit: data.audit.slice(0, 300),
  };
}
