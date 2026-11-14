import styles from "./loading.module.css";

export default function Loading() {
  return (
    <main className={styles.loading} aria-busy="true">
      <p className={styles.status} role="status" aria-live="polite">
        กำลังโหลดเนื้อหา
      </p>
      <span className={styles.dots} aria-hidden="true">
        <span className={styles.dot} />
        <span className={styles.dot} />
        <span className={styles.dot} />
      </span>
    </main>
  );
}
