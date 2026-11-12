import type { Metadata } from "next";

import { subjects } from "@/lib/catalog";

import { SubjectBrowser } from "./catalog-browser";

export const metadata: Metadata = { title: "Subjects | SI Tutor" };

export default function SubjectsPage() {
  return <SubjectBrowser subjects={subjects} />;
}
