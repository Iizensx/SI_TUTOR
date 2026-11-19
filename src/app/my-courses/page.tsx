import { connection } from "next/server";

import { getPublicCourses } from "@/lib/server/catalog-store";
import { MyCoursesDashboard } from "./my-courses-dashboard";

export default async function MyCoursesPage() {
  await connection();
  return <MyCoursesDashboard catalog={await getPublicCourses()} />;
}
