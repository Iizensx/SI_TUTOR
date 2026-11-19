import { NextRequest, NextResponse } from "next/server";
import { AuthError, authenticateUser, createUser, findUser, changeUserPassword, updateUserProfile } from "@/lib/server/user-repository";
import type { StudentLevel } from "@/lib/auth-types";
import { endSession, readSession, sessions, startSession } from "@/lib/server/session";

export const runtime = "nodejs";
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
    const { session } = readSession(request);
    if (!session) return json({ user: null });
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
    const response = json({ user }, data.action === "signup" ? 201 : 200);
    startSession(request, response, user.id, data.remember === true);
    return response;
  } catch (error) {
    if (error instanceof AuthError) return json({ error: error.message }, error.status);
    if (error instanceof SyntaxError) return json({ error: "Invalid form data." }, 400);
    return json({ error: "We could not save or load your account. Please try again." }, 503);
  }
}

export async function PATCH(request: NextRequest) {
  if (!allowedOrigin(request)) return json({ error: "This request is not allowed." }, 403);
  if (!request.headers.get("content-type")?.includes("application/json")) return json({ error: "Expected JSON data." }, 415);

  const { token, session } = readSession(request);
  if (!session) return json({ error: "Please log in again." }, 401);

  try {
    const body: unknown = await request.json();
    if (!body || typeof body !== "object") throw new AuthError("Please complete the form.");
    const data = body as Record<string, unknown>;
    if (data.action === "profile") {
      const firstName = typeof data.firstName === "string" ? data.firstName.trim() : "";
      const lastName = typeof data.lastName === "string" ? data.lastName.trim() : "";
      if (!firstName || !lastName || firstName.length > 60 || lastName.length > 60) {
        throw new AuthError("Enter your first and last name (up to 60 characters each).");
      }
      const avatar = data.avatar;
      if (avatar !== undefined && avatar !== "blue" && avatar !== "violet" && avatar !== "green" && avatar !== "amber") {
        throw new AuthError("Choose a valid profile icon.");
      }
      return json({ user: await updateUserProfile(session.userId, { firstName, lastName, ...(avatar === undefined ? {} : { avatar }) }) });
    }
    if (data.action === "password") {
      const currentPassword = typeof data.currentPassword === "string" ? data.currentPassword : "";
      const password = typeof data.password === "string" ? data.password : "";
      if (!currentPassword || currentPassword.length > 128) throw new AuthError("Enter your current password.");
      if (password.length < 8 || password.length > 128 || !/[a-zA-Z]/.test(password) || !/\d/.test(password)) {
        throw new AuthError("Use 8–128 characters, including a letter and a number.");
      }
      if (password !== data.confirmPassword) throw new AuthError("Your passwords do not match.");
      const user = await changeUserPassword(session.userId, currentPassword, password);
      for (const [key, value] of sessions) if (key !== token && value.userId === session.userId) sessions.delete(key);
      return json({ user });
    }
    throw new AuthError("Unknown account action.");
  } catch (error) {
    if (error instanceof AuthError) return json({ error: error.message }, error.status);
    if (error instanceof SyntaxError) return json({ error: "Invalid form data." }, 400);
    return json({ error: "We could not update your account. Please try again." }, 503);
  }
}


export async function DELETE(request: NextRequest) {
  if (!allowedOrigin(request)) return json({ error: "This request is not allowed." }, 403);
  const response = json({ user: null });
  endSession(request, response);
  return response;
}
