"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState, type FormEvent, type ReactNode } from "react";
import { motion } from "framer-motion";
import { useAuth } from "./auth-provider";
import styles from "./auth.module.css";

type IconKind = "email" | "lock" | "person" | "level";

const oauthMessages: Record<string, string> = {
  google_not_configured: "Google sign-in is not available yet. Please use your email and password.",
  google_cancelled: "Google sign-in was cancelled.",
  google_state: "Your Google sign-in session expired. Please try again.",
  google_unverified: "Your Google account email must be verified before you can sign in.",
  google_failed: "We couldn’t sign you in with Google. Please try again.",
};

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function passwordRules(value: string) {
  return [
    { label: "At least 8 characters", met: value.length >= 8 },
    { label: "At least one number (0–9)", met: /\d/.test(value) },
    { label: "At least one letter (a–z or A–Z)", met: /[a-zA-Z]/.test(value) },
  ];
}

function FieldIcon({ kind }: { kind: IconKind }) {
  return (
    <svg className={styles.fieldIcon} aria-hidden="true" viewBox="0 0 24 24">
      {kind === "email" && <><rect x="3" y="5" width="18" height="14" rx="3" /><path d="m4 7 8 6 8-6" /></>}
      {kind === "person" && <><circle cx="12" cy="8" r="4" /><path d="M4 21v-1a8 8 0 0 1 16 0v1" /></>}
      {kind === "lock" && <><rect x="4" y="10" width="16" height="11" rx="3" /><path d="M8 10V7a4 4 0 0 1 8 0v3m-4 4v3" /></>}
      {kind === "level" && <><path d="M12 4 2 9l10 5 10-5z" /><path d="M6 11v5c0 1.5 2.7 3 6 3s6-1.5 6-3v-5" /></>}
    </svg>
  );
}

function CheckBadge({ show }: { show: boolean }) {
  return (
    <span className={styles.check} data-show={show || undefined} aria-hidden="true">
      <svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9" /><path d="m8 12.5 2.6 2.6L16 9.6" /></svg>
    </span>
  );
}

function Field({
  id, label, icon, valid, invalid, strength, children, action,
}: {
  id: string; label: string; icon: IconKind; valid?: boolean; invalid?: boolean; strength?: number; children: ReactNode; action?: ReactNode;
}) {
  return (
    <div className={styles.field} data-invalid={invalid || undefined} style={strength === undefined ? undefined : { ["--strength" as string]: strength }}>
      <FieldIcon kind={icon} />
      {children}
      <label htmlFor={id}>{label}</label>
      <CheckBadge show={!!valid} />
      {action}
      <span className={styles.underline} data-strength={strength === undefined ? undefined : strength >= 1 ? "strong" : strength > 0.5 ? "medium" : "weak"} aria-hidden="true" />
    </div>
  );
}

function EyeButton({ visible, onToggle, label }: { visible: boolean; onToggle: () => void; label: string }) {
  return (
    <button className={styles.reveal} type="button" aria-label={`${visible ? "Hide" : "Show"} ${label}`} aria-pressed={visible} onClick={onToggle}>
      <svg aria-hidden="true" viewBox="0 0 24 24">
        <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z" />
        <circle cx="12" cy="12" r="3" />
        {!visible && <path d="m3 3 18 18" />}
      </svg>
    </button>
  );
}

function GoogleLogo() {
  return (
    <svg viewBox="0 0 48 48" aria-hidden="true">
      <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3l5.7-5.7C34 6.1 29.3 4 24 4 13 4 4 13 4 24s9 20 20 20 20-9 20-20c0-1.3-.1-2.4-.4-3.5z" />
      <path fill="#FF3D00" d="m6.3 14.7 6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
      <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-7.9l-6.5 5C9.5 39.6 16.2 44 24 44z" />
      <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z" />
    </svg>
  );
}

const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.06, delayChildren: 0.2 } },
};
const rise = {
  hidden: { opacity: 0, y: 14 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] as const } },
};

export function AuthForm({ mode, next, oauthError }: { mode: "login" | "signup"; next: string; oauthError?: string }) {
  const signup = mode === "signup";
  const { user, loading, authenticate, logout } = useAuth();
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const errorRef = useRef<HTMLDivElement>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState(oauthError ? oauthMessages[oauthError] ?? oauthMessages.google_failed : "");
  const [values, setValues] = useState({ firstName: "", lastName: "", email: "", password: "", confirmPassword: "", level: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [mismatch, setMismatch] = useState(false);

  const rules = passwordRules(values.password);
  const metCount = rules.filter((rule) => rule.met).length;
  const passwordValid = signup ? metCount === rules.length : values.password.length > 0;
  const confirmValid = values.confirmPassword.length > 0 && values.confirmPassword === values.password;
  const googleHref = `/api/auth/google?next=${encodeURIComponent(next)}`;

  function update(name: keyof typeof values) {
    return (event: { target: { value: string } }) => {
      setValues((current) => ({ ...current, [name]: event.target.value }));
      if (name === "confirmPassword" || name === "password") setMismatch(false);
    };
  }

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
    if (signup && metCount < rules.length) {
      showError("Your password needs at least 8 characters, including a letter and a number.");
      return;
    }
    setPending(true);
    try {
      await authenticate({ ...data, action: mode, remember: data.remember === "on" });
      router.replace(next);
      router.refresh();
    } catch (caught) {
      showError(caught instanceof Error ? caught.message : "Unable to connect. Please try again.");
    } finally {
      setPending(false);
    }
  }

  if (!loading && user) {
    return (
      <div className={styles.signedIn}>
        <span className={styles.avatar} aria-hidden="true">{user.firstName.slice(0, 1)}{user.lastName.slice(0, 1)}</span>
        <h2>You’re signed in, {user.firstName}.</h2>
        <p>{user.email}</p>
        <Link className={styles.submit} href={next}>
          Continue learning
          <span className={styles.submitArrow} aria-hidden="true">→</span>
        </Link>
        <button className={styles.textButton} type="button" disabled={pending} onClick={async () => {
          setPending(true);
          setError("");
          try { await logout(); } catch { showError("Unable to log out. Please try again."); } finally { setPending(false); }
        }}>{pending ? "Signing out…" : "Use a different account"}</button>
        {error && <div ref={errorRef} tabIndex={-1} role="alert" className={styles.error}>{error}</div>}
      </div>
    );
  }

  return (
    <>
      <form ref={formRef} className={styles.form} onSubmit={submit} aria-busy={pending}>
        <motion.fieldset disabled={pending || loading} variants={stagger} initial="hidden" animate="show">
          {signup && (
            <motion.div variants={rise} className={styles.nameRow}>
              <Field id="firstName" label="First name" icon="person" valid={values.firstName.trim().length > 0}>
                <input id="firstName" name="firstName" placeholder=" " autoComplete="given-name" required maxLength={60} value={values.firstName} onChange={update("firstName")} />
              </Field>
              <Field id="lastName" label="Last name" icon="person" valid={values.lastName.trim().length > 0}>
                <input id="lastName" name="lastName" placeholder=" " autoComplete="family-name" required maxLength={60} value={values.lastName} onChange={update("lastName")} />
              </Field>
            </motion.div>
          )}

          <motion.div variants={rise}>
            <Field id="email" label="Email address" icon="email" valid={emailPattern.test(values.email.trim())}>
              <input id="email" name="email" type="email" placeholder=" " autoComplete="email" autoCapitalize="none" spellCheck={false} required maxLength={254} value={values.email} onChange={update("email")} />
            </Field>
          </motion.div>

          <motion.div variants={rise}>
            <Field
              id="password"
              label={signup ? "Create a password" : "Password"}
              icon="lock"
              valid={signup && passwordValid}
              strength={signup && values.password ? metCount / rules.length : undefined}
              action={<EyeButton visible={showPassword} onToggle={() => setShowPassword(!showPassword)} label="password" />}
            >
              <input
                id="password" name="password" type={showPassword ? "text" : "password"} placeholder=" "
                autoComplete={signup ? "new-password" : "current-password"} required minLength={signup ? 8 : undefined} maxLength={128}
                aria-describedby={signup ? "password-rules" : undefined} value={values.password} onChange={update("password")}
              />
            </Field>
            {signup && (
              <ul id="password-rules" className={styles.rules} aria-label="Password requirements">
                {rules.map((rule) => (
                  <li key={rule.label} data-met={rule.met || undefined}>
                    <svg viewBox="0 0 24 24" aria-hidden="true">{rule.met ? <path d="m5 12.5 4.5 4.5L19 7.5" /> : <circle cx="12" cy="12" r="2.5" />}</svg>
                    {rule.label}
                    <span className="sr-only">{rule.met ? " (met)" : " (not met yet)"}</span>
                  </li>
                ))}
              </ul>
            )}
          </motion.div>

          {signup && (
            <motion.div variants={rise}>
              <Field
                id="confirmPassword"
                label="Re-type password"
                icon="lock"
                valid={confirmValid}
                invalid={mismatch || (values.confirmPassword.length >= values.password.length && values.confirmPassword.length > 0 && !confirmValid)}
                action={<EyeButton visible={showConfirm} onToggle={() => setShowConfirm(!showConfirm)} label="confirm password" />}
              >
                <input
                  id="confirmPassword" name="confirmPassword" type={showConfirm ? "text" : "password"} placeholder=" "
                  autoComplete="new-password" required maxLength={128} aria-invalid={mismatch || undefined}
                  aria-describedby={mismatch ? "form-error" : undefined} value={values.confirmPassword} onChange={update("confirmPassword")}
                />
              </Field>
            </motion.div>
          )}

          {signup ? (
            <motion.div variants={rise}>
              <Field id="level" label="Learning level" icon="level" valid={values.level !== ""}>
                <select id="level" name="level" required value={values.level} onChange={update("level")} data-empty={values.level === "" || undefined}>
                  <option value="" disabled hidden></option>
                  <option>High school</option>
                  <option>University</option>
                  <option>Lifelong learner</option>
                </select>
              </Field>
            </motion.div>
          ) : (
            <motion.label variants={rise} className={styles.remember}>
              <input name="remember" type="checkbox" />
              <span className={styles.box} aria-hidden="true" />
              Keep me logged in
            </motion.label>
          )}

          {error && <div id="form-error" ref={errorRef} tabIndex={-1} role="alert" className={styles.error}>{error}</div>}

          <motion.div variants={rise} className={styles.actions}>
            <button className={styles.submit} type="submit">
              {pending ? (signup ? "Creating account…" : "Logging in…") : loading ? "Loading…" : signup ? "Sign Up" : "Log In"}
              <span className={styles.submitArrow} aria-hidden="true">→</span>
            </button>
            <span className={styles.or}>or</span>
            <a className={styles.google} href={googleHref} aria-label={`${signup ? "Sign up" : "Log in"} with Google`} title="Continue with Google">
              <GoogleLogo />
              <span>Google</span>
            </a>
          </motion.div>
        </motion.fieldset>
      </form>

      {!signup && (
        <details className={styles.demo}>
          <summary><span className={styles.demoDot} /> Just exploring? Try a demo account</summary>
          <div className={styles.demoContent}>
            <p>Student: <strong>student@si-tutor.example</strong><br />Password: <strong>LearnSI2026!</strong></p>
            <button type="button" disabled={pending || loading} onClick={() => {
              setValues((current) => ({ ...current, email: "student@si-tutor.example", password: "LearnSI2026!" }));
              setError("");
              formRef.current?.querySelector<HTMLButtonElement>('button[type="submit"]')?.focus();
            }}>Fill demo details <span aria-hidden="true">→</span></button>
          </div>
        </details>
      )}
    </>
  );
}
