import { timingSafeEqual } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { safeAuthNext } from "@/lib/auth-types";
import { googleConfig, googleRedirectUri, loginErrorUrl, oauthStateCookie } from "@/lib/server/google-oauth";
import { startSession } from "@/lib/server/session";
import { findOrCreateGoogleUser } from "@/lib/server/user-repository";

export const runtime = "nodejs";

type GoogleProfile = { sub?: string; email?: string; email_verified?: boolean; given_name?: string; family_name?: string; name?: string };

function sameState(a: string, b: string) {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  return left.length === right.length && timingSafeEqual(left, right);
}

// Step 2: Google sends the learner back here with a one-time code.
export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  let saved: { state?: string; next?: string } = {};
  try { saved = JSON.parse(request.cookies.get(oauthStateCookie)?.value ?? "{}"); } catch { /* treated as missing */ }
  const next = safeAuthNext(saved.next);

  const fail = (code: string) => {
    const response = NextResponse.redirect(loginErrorUrl(request, code, next));
    response.cookies.set(oauthStateCookie, "", { path: "/api/auth/google", maxAge: 0 });
    return response;
  };

  const config = googleConfig();
  if (!config) return fail("google_not_configured");
  if (params.get("error")) return fail("google_cancelled");
  const code = params.get("code");
  const state = params.get("state") ?? "";
  if (!code || !saved.state || !sameState(state, saved.state)) return fail("google_state");

  try {
    const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: config.clientId,
        client_secret: config.clientSecret,
        redirect_uri: googleRedirectUri(request),
        grant_type: "authorization_code",
      }),
      cache: "no-store",
    });
    if (!tokenResponse.ok) return fail("google_failed");
    const { access_token: accessToken } = await tokenResponse.json() as { access_token?: string };
    if (!accessToken) return fail("google_failed");

    const profileResponse = await fetch("https://openidconnect.googleapis.com/v1/userinfo", {
      headers: { Authorization: `Bearer ${accessToken}` },
      cache: "no-store",
    });
    if (!profileResponse.ok) return fail("google_failed");
    const profile = await profileResponse.json() as GoogleProfile;
    const email = profile.email?.trim().toLowerCase();
    if (!profile.sub || !email || profile.email_verified !== true) return fail("google_unverified");

    const [first = "", ...rest] = (profile.name ?? "").split(" ");
    const user = await findOrCreateGoogleUser({
      googleId: profile.sub,
      email,
      firstName: (profile.given_name ?? first).slice(0, 60),
      lastName: (profile.family_name ?? rest.join(" ")).slice(0, 60),
    });

    const response = NextResponse.redirect(new URL(next, request.nextUrl.origin));
    response.cookies.set(oauthStateCookie, "", { path: "/api/auth/google", maxAge: 0 });
    startSession(request, response, user.id, true);
    return response;
  } catch {
    return fail("google_failed");
  }
}
