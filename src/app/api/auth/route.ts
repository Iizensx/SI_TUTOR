import { randomBytes } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { AuthError, authenticateUser, createUser, findUser } from "@/lib/server/user-repository";
import type { StudentLevel } from "@/lib/auth-types";

export const runtime = "nodejs";
const cookieName = "si-tutor-session";
type Session = { userId: string; expiresAt: number };
const memory = globalThis as typeof globalThis & { siTutorSessions?: Map<string, Session> };
const sessions = memory.siTutorSessions ??= new Map<string, Session>();
const levels: StudentLevel[] = ["High school", "University", "Lifelong learner"];

function json(body: unknown, status = 200) {
  return NextResponse.json(body, { status, headers: { "Cache-Control": "no-store" } });
}

function allowedOrigin(request: NextRequest) {
  const origin = request.headers.get("origin");
  return !origin || origin === request.nextUrl.origin;
}

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get(cookieName)?.value ?? "";
    const session = sessions.get(token);
    if (!session || session.expiresAt <= Date.now()) {
      sessions.delete(token);
      return json({ user: null });
    }
    return json({ user: await findUser(session.userId) });
  } catch {
    return json({ error: "Unable to load your account. Please try again." }, 503);
  }
}

export async function POST(request: NextRequest) {
  if (!allowedOrigin(request)) return json({ error: "This request is not allowed." }, 403);
  if (!request.headers.get("content-type")?.includes("application/json")) return json({ error: "Expected JSON data." }, 415);
  try {
    const body: unknown = await request.json();
    if (!body || typeof body !== "object") throw new AuthError("Please complete the form.");
    const data = body as Record<string, unknown>;
    const email = typeof data.email === "string" ? data.email.trim().toLowerCase() : "";
    const password = typeof data.password === "string" ? data.password : "";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254) throw new AuthError("Enter a valid email address.");
    if (!password || password.length > 128) throw new AuthError("Enter a password of up to 128 characters.");
    let user;
    if (data.action === "signup") {
      const firstName = typeof data.firstName === "string" ? data.firstName.trim() : "";
      const lastName = typeof data.lastName === "string" ? data.lastName.trim() : "";
      if (!firstName || !lastName || firstName.length > 60 || lastName.length > 60) throw new AuthError("Enter your first and last name (up to 60 characters each).");
      if (password.length < 8 || !/[a-zA-Z]/.test(password) || !/\d/.test(password)) throw new AuthError("Use at least 8 characters, including a letter and a number.");
      if (password !== data.confirmPassword) throw new AuthError("Your passwords do not match.");
      if (!levels.includes(data.level as StudentLevel)) throw new AuthError("Choose your learning stage.");
      user = await createUser({ firstName, lastName, email, password, level: data.level as StudentLevel });
    } else if (data.action === "login") {
      user = await authenticateUser(email, password);
    } else {
      throw new AuthError("Unknown account action.");
    }
    for (const [key, value] of sessions) if (value.expiresAt <= Date.now()) sessions.delete(key);
    const oldToken = request.cookies.get(cookieName)?.value;
    if (oldToken) sessions.delete(oldToken);
    const token = randomBytes(32).toString("hex");
    const maxAge = data.remember === true ? 30 * 24 * 60 * 60 : 12 * 60 * 60;
    sessions.set(token, { userId: user.id, expiresAt: Date.now() + maxAge * 1000 });
    const response = json({ user }, data.action === "signup" ? 201 : 200);
    response.cookies.set(cookieName, token, {
      httpOnly: true, sameSite: "lax", secure: request.nextUrl.protocol === "https:", path: "/",
      ...(data.remember === true ? { maxAge } : {}),
    });
    return response;
  } catch (error) {
    if (error instanceof AuthError) return json({ error: error.message }, error.status);
    if (error instanceof SyntaxError) return json({ error: "Invalid form data." }, 400);
    return json({ error: "We could not save or load your account. Please try again." }, 503);
  }
}

export async function DELETE(request: NextRequest) {
  if (!allowedOrigin(request)) return json({ error: "This request is not allowed." }, 403);
  sessions.delete(request.cookies.get(cookieName)?.value ?? "");
  const response = json({ user: null });
  response.cookies.set(cookieName, "", { httpOnly: true, sameSite: "lax", path: "/", maxAge: 0 });
  return response;
}
