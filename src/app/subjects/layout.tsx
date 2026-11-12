import type { ReactNode } from "react";

import { Breadcrumbs } from "@/components/catalog-shell";

import styles from "./catalog.module.css";

export default function SubjectsLayout({ children }: { children: ReactNode }) {
  return (
    <main id="main-content" tabIndex={-1} className={styles.subjectPage}>
      <div className={styles.subjectContainer}>
        <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Subjects" }]} />
        {children}
      </div>
    </main>
  );
}
