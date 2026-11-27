
import Link from "next/link";
import styles from "./footer.module.css";

export default function Footer() {
  return (
    <footer className={styles.footer}>
      <div className={styles.paymentRow}>
        <span>We accept:</span>

        <span
          className={styles.paymentMarks}
          aria-label="Payment methods"
        >
          <b className={styles.mastercard}>●●</b>
          <b className={styles.visa}>VISA</b>
          <b className={styles.amex}>AMEX</b>
          <b className={styles.paypal}>PayPal</b>
          <b className={styles.applePay}> Pay</b>
          <b className={styles.afterpay}>afterpay</b>
        </span>
      </div>

      <nav
        aria-label="Footer navigation"
        className={styles.footerLinks}
      >
        <Link href="/subjects">Subjects</Link>
        <Link href="/pricing">Pricing</Link>
        <Link href="/about">About</Link>
        <Link href="/my-courses">My Courses</Link>
      </nav>

      <p>© 2026 SI TUTOR</p>
    </footer>
  );
}
