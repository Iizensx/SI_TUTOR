import type { NextRequest } from "next/server";
import type { AdminRole, UserProfile } from "@/lib/auth-types";
import { readSession } from "./session";
import { findUser } from "./user-repository";

export class AdminAccessError extends Error {
  constructor(message: string, public status: number) { super(message); }
}

/** Returns the signed-in admin, or throws 401/403. Pass roles to require one of them. */
export async function requireAdmin(request: NextRequest, roles?: AdminRole[]): Promise<UserProfile & { adminRole: AdminRole }> {
  const { session } = readSession(request);
  if (!session) throw new AdminAccessError("Please log in.", 401);
  const user = await findUser(session.userId);
  if (!user || user.role !== "admin") throw new AdminAccessError("Admins only.", 403);
  const adminRole = user.adminRole ?? "support";
  if (roles && !roles.includes(adminRole)) {
    throw new AdminAccessError(`Your role (${adminRole}) cannot do this. Ask an owner.`, 403);
  }
  return { ...user, adminRole };
}
