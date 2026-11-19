import { randomBytes } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { safeAuthNext } from "@/lib/auth-types";
import { googleConfig, googleRedirectUri, loginErrorUrl, oauthStateCookie } from "@/lib/server/google-oauth";

export const runtime = "nodejs";

// Step 1: send the learner to Google's consent screen.
export async function GET(request: NextRequest) {
  const next = safeAuthNext(request.nextUrl.searchParams.get("next"));
  const config = googleConfig();
  if (!config) return NextResponse.redirect(loginErrorUrl(request, "google_not_configured", next));

  const state = randomBytes(24).toString("hex");
  const url = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  url.search = new URLSearchParams({
    client_id: config.clientId,
    redirect_uri: googleRedirectUri(request),
    response_type: "code",
    scope: "openid email profile",
    state,
    prompt: "select_account",
  }).toString();

  const response = NextResponse.redirect(url);
  response.cookies.set(oauthStateCookie, JSON.stringify({ state, next }), {
    httpOnly: true,
    sameSite: "lax",
    secure: request.nextUrl.protocol === "https:",
    path: "/api/auth/google",
    maxAge: 10 * 60,
  });
  return response;
}
