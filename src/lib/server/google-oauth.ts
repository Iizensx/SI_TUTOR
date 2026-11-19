import type { NextRequest } from "next/server";

// Google OAuth 2.0 (authorization code flow) without extra dependencies.
// Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in .env.local. See .env.example.
export const oauthStateCookie = "si-tutor-oauth";

export function googleConfig() {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  return clientId && clientSecret ? { clientId, clientSecret } : null;
}

export function googleRedirectUri(request: NextRequest) {
  return process.env.GOOGLE_REDIRECT_URI || `${request.nextUrl.origin}/api/auth/google/callback`;
}

export function loginErrorUrl(request: NextRequest, code: string, next?: string) {
  const url = new URL("/login", request.nextUrl.origin);
  url.searchParams.set("error", code);
  if (next) url.searchParams.set("next", next);
  return url;
}
