import { connection } from "next/server";

import { subjects } from "@/lib/catalog";
import { getPublicCourses } from "@/lib/server/catalog-store";

import { HomeExperience } from "./home-experience";

// "2.4k" → 2400, "850" → 850
function reviewCount(value: string) {
  const number = Number.parseFloat(value);
  return value.toLowerCase().endsWith("k") ? number * 1000 : number;
}

export default async function Home() {
  await connection();
  const courses = await getPublicCourses();
  // The best-rated course from each subject, so the row shows a variety of categories.
  const score = (course: (typeof courses)[number]) => reviewCount(course.reviews) * course.rating;
  const popular = subjects
    .map(({ slug }) => courses.filter((course) => course.subjectSlug === slug && course.rating > 0).sort((a, b) => score(b) - score(a))[0])
    .filter((course) => course !== undefined)
    .sort((a, b) => score(b) - score(a))
    .slice(0, 4);

  return <HomeExperience subjects={subjects} courseCount={courses.length} popular={popular} />;
}
