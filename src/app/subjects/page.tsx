import type { Metadata } from "next";

import { connection } from "next/server";

import { subjects } from "@/lib/catalog";
import { getPublicCourses } from "@/lib/server/catalog-store";

import { SubjectBrowser } from "./catalog-browser";

export const metadata: Metadata = { title: "Subjects | SI Tutor" };

export default async function SubjectsPage() {
  await connection();
  return <SubjectBrowser subjects={subjects} catalog={await getPublicCourses()} />;
}
