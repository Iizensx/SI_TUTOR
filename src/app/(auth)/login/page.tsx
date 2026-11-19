import type { Metadata } from "next";
import { AuthScreen } from "@/components/auth-screen";
import { safeAuthNext } from "@/lib/auth-types";

export const metadata: Metadata = { title: "Log in | SI Tutor" };

export default async function Page({ searchParams }: { searchParams: Promise<{ next?: string | string[]; error?: string | string[] }> }) {
  const { next, error } = await searchParams;
  return <AuthScreen mode="login" next={next === undefined ? "/" : safeAuthNext(next)} oauthError={typeof error === "string" ? error : undefined} />;
}
