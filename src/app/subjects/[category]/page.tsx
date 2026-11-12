import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { getCoursesBySubject, getSubject, subjects } from "@/lib/catalog";

import { CourseBrowser } from "../catalog-browser";

type PageProps = { params: Promise<{ category: string }> };

export function generateStaticParams() {
  return subjects.map(({ slug }) => ({ category: slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { category } = await params;
  const subject = getSubject(category);
  return { title: subject ? `${subject.name} Courses | SI Tutor` : "Courses | SI Tutor" };
}

export default async function CategoryPage({ params }: PageProps) {
  const { category } = await params;
  const subject = getSubject(category);
  if (!subject) notFound();

  return <CourseBrowser subjects={subjects} subject={subject} courses={getCoursesBySubject(category)} />;
}
