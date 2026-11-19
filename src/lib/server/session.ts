import { randomBytes } from "node:crypto";
import type { NextRequest, NextResponse } from "next/server";

// In-memory sessions shared by every auth route in this Node process.
// Restarting the server clears them. Move to persistent storage for production.
export const sessionCookieName = "si-tutor-session";
export type Session = { userId: string; expiresAt: number };

const memory = globalThis as typeof globalThis & { siTutorSessions?: Map<string, Session> };
export const sessions = memory.siTutorSessions ??= new Map<string, Session>();

export function readSession(request: NextRequest) {
  const token = request.cookies.get(sessionCookieName)?.value ?? "";
  const session = sessions.get(token);
  if (!session || session.expiresAt <= Date.now()) {
    sessions.delete(token);
    return { token, session: null };
  }
  return { token, session };
}

export function startSession(request: NextRequest, response: NextResponse, userId: string, remember: boolean) {
  for (const [key, value] of sessions) if (value.expiresAt <= Date.now()) sessions.delete(key);
  const oldToken = request.cookies.get(sessionCookieName)?.value;
  if (oldToken) sessions.delete(oldToken);
  const token = randomBytes(32).toString("hex");
  const maxAge = remember ? 30 * 24 * 60 * 60 : 12 * 60 * 60;
  sessions.set(token, { userId, expiresAt: Date.now() + maxAge * 1000 });
  response.cookies.set(sessionCookieName, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: request.nextUrl.protocol === "https:",
    path: "/",
    ...(remember ? { maxAge } : {}),
  });
}

export function endSession(request: NextRequest, response: NextResponse) {
  sessions.delete(request.cookies.get(sessionCookieName)?.value ?? "");
  response.cookies.set(sessionCookieName, "", { httpOnly: true, sameSite: "lax", path: "/", maxAge: 0 });
}
