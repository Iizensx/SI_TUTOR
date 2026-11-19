import type { Metadata } from "next";

import { AboutExperience } from "./about-experience";

export const metadata: Metadata = {
  title: "About | SI Tutor",
  description:
    "SI Tutor (Super Intelligence Tutor) brings adaptive AI tutoring, clear lessons, study files and progress tracking together in one place.",
};

export default function AboutPage() {
  return <AboutExperience />;
}
