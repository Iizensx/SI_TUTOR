import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { connection } from "next/server";

import { getSubject, subjects } from "@/lib/catalog";
import { getPublicCourses } from "@/lib/server/catalog-store";

import { CourseBrowser } from "../catalog-browser";

type PageProps = { params: Promise<{ category: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { category } = await params;
  const subject = getSubject(category);
  return { title: subject ? `${subject.name} Courses | SI Tutor` : "Courses | SI Tutor" };
}

export default async function CategoryPage({ params }: PageProps) {
  await connection();
  const { category } = await params;
  const subject = getSubject(category);
  if (!subject) notFound();
  const catalog = await getPublicCourses();

  return <CourseBrowser subjects={subjects} catalog={catalog} subject={subject} courses={catalog.filter((course) => course.subjectSlug === category)} />;
}
