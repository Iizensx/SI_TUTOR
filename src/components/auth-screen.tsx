import Link from "next/link";
import { AuthForm } from "./auth-form";
import styles from "./auth.module.css";

const copy = {
  signup: {
    title: "Sign Up",
    subtitle: "Create your free account and start learning smarter with SI Tutor.",
    switchText: "Already a member?",
    switchLabel: "Log in",
    switchHref: "/login",
  },
  login: {
    title: "Log In",
    subtitle: "Welcome back. Pick up right where you left off.",
    switchText: "New to SI Tutor?",
    switchLabel: "Sign up",
    switchHref: "/signup",
  },
} as const;

/** Form side of the auth card. The surrounding card, image and background live in AuthShell. */
export function AuthScreen({ mode, next, oauthError }: { mode: "login" | "signup"; next: string; oauthError?: string }) {
  const text = copy[mode];
  return (
    <div className={styles.formInner}>
      <div className={styles.formTop}>
        <Link href="/" className={styles.backMobile} aria-label="Back to home">
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M19 12H5m6-6-6 6 6 6" /></svg>
        </Link>
        <p className={styles.switch}>
          {text.switchText}{" "}
          <Link href={`${text.switchHref}?next=${encodeURIComponent(next)}`} scroll={false}>{text.switchLabel}</Link>
        </p>
      </div>

      <div className={styles.formBody}>
        <div className={styles.heading}>
          <h1 id="auth-title">{text.title}</h1>
          <svg className={styles.squiggle} viewBox="0 0 60 40" aria-hidden="true">
            <path d="M54 6C40 2 22 8 14 30m0 0-2-9m2 9 8-4" />
          </svg>
        </div>
        <p className={styles.subtitle}>{text.subtitle}</p>
        <AuthForm key={mode} mode={mode} next={next} oauthError={oauthError} />
      </div>
    </div>
  );
}
