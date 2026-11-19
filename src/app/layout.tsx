import type { Metadata } from "next";
import type { ReactNode } from "react";
import { SiteHeader } from "@/components/site-header";
import { AuthProvider } from "@/components/auth-provider";
// Brand font: Poppins (self-hosted @font-face in globals.css).
// Noto Sans Thai covers Thai glyphs, which Poppins does not include.
import "@fontsource-variable/noto-sans-thai";
import "./globals.css";

export const metadata: Metadata = {
  title: "SI Tutor | Super Intelligence Tutor",
  description: "Explore HSC, IELTS, SI & Robotics, University Mathematics and Australian Citizenship with SI Tutor.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <a href="#main-content" className="skip-link">Skip to main content</a>
        <AuthProvider>
          <SiteHeader />
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
