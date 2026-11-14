import type { Metadata } from "next";
import { AuthScreen } from "@/components/auth-screen";
import { safeAuthNext } from "@/lib/auth-types";

export const metadata: Metadata = { title: "Log in | SI Tutor" };

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string | string[] }> }) {
  const { next } = await searchParams;
  return <AuthScreen mode="login" next={safeAuthNext(next)} />;
}
