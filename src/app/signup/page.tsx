import type { Metadata } from "next";
import { AuthScreen } from "@/components/auth-screen";
import { safeAuthNext } from "@/lib/auth-types";

export const metadata: Metadata = { title: "Sign up | SI Tutor" };

export default async function SignupPage({ searchParams }: { searchParams: Promise<{ next?: string | string[] }> }) {
  const { next } = await searchParams;
  return <AuthScreen mode="signup" next={safeAuthNext(next)} />;
}
