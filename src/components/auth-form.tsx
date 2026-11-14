"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState, type FormEvent } from "react";
import { useAuth } from "./auth-provider";
import styles from "./auth.module.css";

function FieldIcon({ kind }: { kind: "email" | "lock" | "person" }) {
  return <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    {kind === "email" ? <><rect x="3" y="5" width="18" height="14" rx="3" /><path d="m4 7 8 6 8-6" /></> : kind === "person" ? <><circle cx="12" cy="8" r="4" /><path d="M4 21v-2a8 8 0 0 1 16 0v2" /></> : <><rect x="4" y="10" width="16" height="11" rx="3" /><path d="M8 10V7a4 4 0 0 1 8 0v3m-4 4v3" /></>}
  </svg>;
}

function PasswordField({ confirm = false, signup, invalid, onChange }: { confirm?: boolean; signup: boolean; invalid?: boolean; onChange?: () => void }) {
  const [visible, setVisible] = useState(false);
  const name = confirm ? "confirmPassword" : "password";
  return <div className={styles.field}>
    <label htmlFor={name}>{confirm ? "Confirm password" : "Password"}</label>
    <div className={styles.inputWrap}>
      <FieldIcon kind="lock" />
      <input id={name} name={name} type={visible ? "text" : "password"} placeholder={confirm ? "Enter your password again" : signup ? "Create a password" : "Enter your password"} autoComplete={signup ? "new-password" : "current-password"} required minLength={signup ? 8 : undefined} maxLength={128} aria-invalid={invalid || undefined} aria-describedby={invalid ? "form-error" : signup && !confirm ? "password-hint" : undefined} onChange={onChange} />
      <button className={styles.reveal} type="button" aria-label={`${visible ? "Hide" : "Show"} ${confirm ? "confirm password" : "password"}`} aria-pressed={visible} onClick={() => setVisible(!visible)}>
        <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z" /><circle cx="12" cy="12" r="3" />{visible && <path d="m3 3 18 18" />}</svg>
      </button>
    </div>
    {signup && !confirm && <small id="password-hint">At least 8 characters, with a letter and a number.</small>}
  </div>;
}

export function AuthForm({ mode, next }: { mode: "login" | "signup"; next: string }) {
  const signup = mode === "signup";
  const { user, loading, authenticate, logout } = useAuth();
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const errorRef = useRef<HTMLDivElement>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [mismatch, setMismatch] = useState(false);

  function showError(message: string) {
    setError(message);
    requestAnimationFrame(() => errorRef.current?.focus());
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) return;
    const data = Object.fromEntries(new FormData(event.currentTarget));
    setError("");
    setMismatch(false);
    if (signup && data.password !== data.confirmPassword) {
      setMismatch(true);
      showError("Your passwords do not match. Please check them and try again.");
      return;
    }
    if (signup && (!/[a-zA-Z]/.test(String(data.password)) || !/\d/.test(String(data.password)))) {
      showError("Add at least one letter and one number to your password.");
      return;
    }
    setPending(true);
    try {
      await authenticate({ ...data, action: mode, remember: data.remember === "on" });
      router.replace(next);
      router.refresh();
    } catch (error) {
      showError(error instanceof Error ? error.message : "Unable to connect. Please try again.");
    } finally { setPending(false); }
  }

  if (!loading && user) return <div className={styles.signedIn}>
    <span className={styles.avatar} aria-hidden="true">{user.firstName.slice(0, 1)}{user.lastName.slice(0, 1)}</span>
    <h2>You’re signed in, {user.firstName}.</h2>
    <p>{user.email}</p>
    <Link className={styles.submit} href={next}>Continue learning <span aria-hidden="true">→</span></Link>
    <button className={styles.textButton} type="button" disabled={pending} onClick={async () => {
      setPending(true);
      setError("");
      try { await logout(); } catch { showError("Unable to log out. Please try again."); } finally { setPending(false); }
    }}>{pending ? "Signing out…" : "Use a different account"}</button>
    {error && <div ref={errorRef} tabIndex={-1} role="alert" className={styles.error}>{error}</div>}
  </div>;

  return <>
    <form ref={formRef} className={styles.form} onSubmit={submit} aria-busy={pending}>
      <fieldset disabled={pending || loading}>
        {signup && <div className={styles.nameRow}>
          <div className={styles.field}><label htmlFor="firstName">First name</label><div className={styles.inputWrap}><FieldIcon kind="person" /><input id="firstName" name="firstName" placeholder="First name" autoComplete="given-name" required maxLength={60} /></div></div>
          <div className={styles.field}><label htmlFor="lastName">Last name</label><div className={styles.inputWrap}><FieldIcon kind="person" /><input id="lastName" name="lastName" placeholder="Last name" autoComplete="family-name" required maxLength={60} /></div></div>
        </div>}
        <div className={styles.field}>
          <label htmlFor="email">Email address</label>
          <div className={styles.inputWrap}><FieldIcon kind="email" /><input id="email" name="email" type="email" placeholder="you@example.com" autoComplete="email" autoCapitalize="none" spellCheck={false} required maxLength={254} /></div>
        </div>
        <PasswordField signup={signup} />
        {signup && <PasswordField signup confirm invalid={mismatch} onChange={() => setMismatch(false)} />}
        {signup ? <div className={styles.field}>
          <label htmlFor="level">Where are you in your learning journey?</label>
          <select id="level" name="level" required defaultValue=""><option value="" disabled>Select your learning stage</option><option>High school</option><option>University</option><option>Lifelong learner</option></select>
        </div> : <label className={styles.remember}><input name="remember" type="checkbox" /> Keep me logged in</label>}
        {error && <div id="form-error" ref={errorRef} tabIndex={-1} role="alert" className={styles.error}>{error}</div>}
        <button className={styles.submit} type="submit">{pending ? signup ? "Creating your account…" : "Logging in…" : loading ? "Loading…" : signup ? "Create account" : "Log in"}<span aria-hidden="true">→</span></button>
      </fieldset>
    </form>
    <p className={styles.switchMode}>{signup ? "Already learning with us?" : "New to SI Tutor?"} <Link href={`/${signup ? "login" : "signup"}?next=${encodeURIComponent(next)}`}>{signup ? "Log in" : "Create an account"} <span aria-hidden="true">↗</span></Link></p>
    {!signup && <details className={styles.demo}>
      <summary><span className={styles.demoDot} /> Just exploring? Try a demo account</summary>
      <div className={styles.demoContent}>
        <p>Student: <strong>student@si-tutor.example</strong><br />Password: <strong>LearnSI2026!</strong></p>
        <button type="button" disabled={pending || loading} onClick={() => {
          const form = formRef.current;
          if (!form) return;
          (form.elements.namedItem("email") as HTMLInputElement).value = "student@si-tutor.example";
          (form.elements.namedItem("password") as HTMLInputElement).value = "LearnSI2026!";
          setError("");
          form.querySelector<HTMLButtonElement>('button[type="submit"]')?.focus();
        }}>Fill demo details <span aria-hidden="true">→</span></button>
      </div>
    </details>}
    <p className={styles.demoNote}>Demo environment · Use sample details only.</p>
  </>;
}
