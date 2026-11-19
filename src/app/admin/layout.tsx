import type { Metadata } from "next";
import type { ReactNode } from "react";
import { AdminShell } from "./_components/shell";

export const metadata: Metadata = { title: "Admin | SI Tutor", robots: { index: false, follow: false } };

export default function AdminLayout({ children }: { children: ReactNode }) {
  return <AdminShell>{children}</AdminShell>;
}
