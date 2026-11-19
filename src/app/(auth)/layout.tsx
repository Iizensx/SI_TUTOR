import type { ReactNode } from "react";
import { AuthShell } from "@/components/auth-card";

// Shared by /login and /signup, so the card stays mounted and can animate the side swap.
export default function AuthLayout({ children }: { children: ReactNode }) {
  return <AuthShell>{children}</AuthShell>;
}
