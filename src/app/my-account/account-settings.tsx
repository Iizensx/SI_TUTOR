"use client";

import Link from "next/link";
import { useState, type FormEvent, type ReactNode } from "react";
import { AnimatePresence, MotionConfig, motion } from "framer-motion";

import { AccountAvatar, avatarOptions, type AvatarColor } from "@/components/account-avatar";
import { useAuth } from "@/components/auth-provider";
import { useDemoAccess } from "@/components/course-access";
import { courses } from "@/lib/catalog";
import type { UserProfile } from "@/lib/auth-types";

import styles from "./account.module.css";

type Notice = { text: string; error: boolean } | null;
const ease = [0.22, 1, 0.36, 1] as const;
const avatarNames: Record<AvatarColor, string> = { blue: "Sky", violet: "Lavender", green: "Mint", amber: "Sunny" };

function Reveal({ children, delay = 0 }: { children: ReactNode; delay?: number }) {
  return (
    <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease, delay }}>
      {children}
    </motion.div>
  );
}

function Feedback({ notice }: { notice: Notice }) {
  return (
    <AnimatePresence>
      {notice && (
        <motion.p
          key={notice.text}
          className={styles.feedback}
          data-error={notice.error || undefined}
          role={notice.error ? "alert" : "status"}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
        >
          <svg viewBox="0 0 24 24" aria-hidden="true">
            {notice.error ? <path d="M12 8v5m0 3.5v.01M12 3a9 9 0 1 1 0 18 9 9 0 0 1 0-18Z" /> : <path d="m7 12.5 3.2 3.2L17 9M12 3a9 9 0 1 1 0 18 9 9 0 0 1 0-18Z" />}
          </svg>
          {notice.text}
        </motion.p>
      )}
    </AnimatePresence>
  );
}

function Icon({ name }: { name: "user" | "mail" | "lock" }) {
  return (
    <svg className={styles.fieldIcon} viewBox="0 0 24 24" aria-hidden="true">
      {name === "user" && <><circle cx="12" cy="8" r="3.6" /><path d="M5 20v-1a6 6 0 0 1 6-6h2a6 6 0 0 1 6 6v1" /></>}
      {name === "mail" && <><rect x="3" y="5" width="18" height="14" rx="3" /><path d="m4 7 8 6 8-6" /></>}
      {name === "lock" && <><rect x="4" y="10" width="16" height="11" rx="3" /><path d="M8 10V7a4 4 0 0 1 8 0v3" /></>}
    </svg>
  );
}

function ProfileForm({ user }: { user: UserProfile }) {
  const { updateAccount } = useAuth();
  const [firstName, setFirstName] = useState(user.firstName);
  const [lastName, setLastName] = useState(user.lastName);
  const [avatar, setAvatar] = useState<AvatarColor>(user.avatar ?? "blue");
  const [notice, setNotice] = useState<Notice>(null);
  const [busy, setBusy] = useState(false);
  const dirty = firstName.trim() !== user.firstName || lastName.trim() !== user.lastName || avatar !== (user.avatar ?? "blue");

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setNotice(null);
    try {
      await updateAccount({ action: "profile", firstName, lastName, avatar });
      setFirstName(firstName.trim());
      setLastName(lastName.trim());
      setNotice({ text: "Profile saved.", error: false });
    } catch (cause) {
      setNotice({ text: cause instanceof Error ? cause.message : "Could not save your profile.", error: true });
    } finally {
      setBusy(false);
    }
  }

  return (
    <section id="profile" className={styles.card} aria-labelledby="profile-title">
      <div className={styles.cardHead}>
        <span className={styles.cardIcon} style={{ background: "#e0f2fe" }}><Icon name="user" /></span>
        <div>
          <h2 id="profile-title">Account information</h2>
          <p className={styles.description}>Choose how your profile appears in SI Tutor.</p>
        </div>
      </div>
      <form onSubmit={save}>
        <fieldset disabled={busy}>
          <legend className={styles.label}>Profile avatar</legend>
          <div className={styles.avatars}>
            {avatarOptions.map((color) => (
              <label key={color} className={styles.avatarOption}>
                <input type="radio" name="avatar" value={color} checked={avatar === color} onChange={() => setAvatar(color)} />
                <span className={styles.choice}>
                  {avatar === color && <motion.span layoutId="avatar-ring" className={styles.ring} transition={{ type: "spring", stiffness: 380, damping: 30 }} />}
                  <motion.span className={styles.choiceAvatar} whileHover={{ y: -3 }} whileTap={{ scale: 0.94 }}>
                    <AccountAvatar user={user} color={color} />
                  </motion.span>
                  <span className={styles.choiceName}>{avatarNames[color]}</span>
                  {avatar === color && (
                    <motion.span className={styles.tick} initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 500, damping: 20 }} aria-hidden="true">
                      <svg viewBox="0 0 24 24"><path d="m6.5 12.5 3.6 3.6L17.5 8.7" /></svg>
                    </motion.span>
                  )}
                </span>
              </label>
            ))}
          </div>

          <div className={styles.fields}>
            <label className={styles.field}>
              <span className={styles.label}>First name</span>
              <span className={styles.inputWrap}><Icon name="user" /><input autoComplete="given-name" required maxLength={60} value={firstName} onChange={(event) => setFirstName(event.target.value)} /></span>
            </label>
            <label className={styles.field}>
              <span className={styles.label}>Last name</span>
              <span className={styles.inputWrap}><Icon name="user" /><input autoComplete="family-name" required maxLength={60} value={lastName} onChange={(event) => setLastName(event.target.value)} /></span>
            </label>
            <label className={`${styles.field} ${styles.fullField}`}>
              <span className={styles.label}>Email address <em>Can’t be changed</em></span>
              <span className={styles.inputWrap}><Icon name="mail" /><input type="email" autoComplete="email" value={user.email} readOnly /></span>
            </label>
          </div>

          <div className={styles.actions}>
            <button type="submit" className={styles.primary} disabled={!dirty || busy}>
              {busy ? "Saving…" : "Save changes"}
            </button>
            {dirty && !busy && (
              <button type="button" className={styles.ghost} onClick={() => { setFirstName(user.firstName); setLastName(user.lastName); setAvatar(user.avatar ?? "blue"); setNotice(null); }}>
                Discard
              </button>
            )}
          </div>
        </fieldset>
        <Feedback notice={notice} />
      </form>
    </section>
  );
}

function PasswordInput({ name, label, autoComplete, value, onChange, full = false }: {
  name: string; label: string; autoComplete: string; value: string; onChange: (value: string) => void; full?: boolean;
}) {
  const [visible, setVisible] = useState(false);
  return (
    <label className={`${styles.field} ${full ? styles.fullField : ""}`}>
      <span className={styles.label}>{label}</span>
      <span className={styles.inputWrap}>
        <Icon name="lock" />
        <input type={visible ? "text" : "password"} name={name} autoComplete={autoComplete} required maxLength={128} value={value} onChange={(event) => onChange(event.target.value)} />
        <button type="button" className={styles.reveal} aria-label={`${visible ? "Hide" : "Show"} ${label.toLowerCase()}`} aria-pressed={visible} onClick={() => setVisible(!visible)}>
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z" /><circle cx="12" cy="12" r="3" />{!visible && <path d="m3 3 18 18" />}</svg>
        </button>
      </span>
    </label>
  );
}

function PasswordForm() {
  const { updateAccount } = useAuth();
  const [notice, setNotice] = useState<Notice>(null);
  const [busy, setBusy] = useState(false);
  const [values, setValues] = useState({ currentPassword: "", password: "", confirmPassword: "" });
  const rules = [
    { label: "8+ characters", met: values.password.length >= 8 },
    { label: "A number", met: /\d/.test(values.password) },
    { label: "A letter", met: /[a-zA-Z]/.test(values.password) },
    { label: "Passwords match", met: values.password.length > 0 && values.password === values.confirmPassword },
  ];
  const strength = rules.slice(0, 3).filter((rule) => rule.met).length;
  const ready = values.currentPassword.length > 0 && rules.every((rule) => rule.met);
  const set = (key: keyof typeof values) => (value: string) => setValues((current) => ({ ...current, [key]: value }));

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setNotice(null);
    try {
      await updateAccount({ action: "password", ...values });
      setValues({ currentPassword: "", password: "", confirmPassword: "" });
      setNotice({ text: "Password updated.", error: false });
    } catch (cause) {
      setNotice({ text: cause instanceof Error ? cause.message : "Could not update your password.", error: true });
    } finally {
      setBusy(false);
    }
  }

  return (
    <section id="password" className={styles.card} aria-labelledby="password-title">
      <div className={styles.cardHead}>
        <span className={styles.cardIcon} style={{ background: "#ede9fe" }}><Icon name="lock" /></span>
        <div>
          <h2 id="password-title">Password</h2>
          <p className={styles.description}>Use at least 8 characters, including a letter and a number.</p>
        </div>
      </div>
      <form onSubmit={save}>
        <fieldset disabled={busy} aria-label="Change password">
          <div className={styles.fields}>
            <PasswordInput full name="currentPassword" label="Current password" autoComplete="current-password" value={values.currentPassword} onChange={set("currentPassword")} />
            <PasswordInput name="password" label="New password" autoComplete="new-password" value={values.password} onChange={set("password")} />
            <PasswordInput name="confirmPassword" label="Confirm new password" autoComplete="new-password" value={values.confirmPassword} onChange={set("confirmPassword")} />
          </div>

          <div className={styles.strength} aria-hidden="true">
            {[0, 1, 2].map((index) => (
              <span key={index}>
                <motion.i
                  initial={false}
                  animate={{ scaleX: strength > index ? 1 : 0 }}
                  transition={{ duration: 0.35, ease }}
                  data-level={strength}
                />
              </span>
            ))}
          </div>
          <ul className={styles.rules} aria-label="Password requirements">
            {rules.map((rule) => (
              <li key={rule.label} data-met={rule.met || undefined}>
                <svg viewBox="0 0 24 24" aria-hidden="true">{rule.met ? <path d="m6 12.5 4 4L18 8.5" /> : <circle cx="12" cy="12" r="3" />}</svg>
                {rule.label}
                <span className="sr-only">{rule.met ? " (met)" : " (not met yet)"}</span>
              </li>
            ))}
          </ul>

          <div className={styles.actions}>
            <button type="submit" className={styles.secondary} disabled={!ready || busy}>{busy ? "Updating…" : "Update password"}</button>
          </div>
        </fieldset>
        <Feedback notice={notice} />
      </form>
    </section>
  );
}

function Hero({ user }: { user: UserProfile }) {
  const access = useDemoAccess();
  const active = courses.filter((course) => (access.purchases[course.slug] ?? 0) > access.now).length;
  const since = new Date(user.createdAt);
  const memberSince = Number.isNaN(since.getTime()) ? "—" : since.toLocaleDateString("en-AU", { month: "short", year: "numeric" });

  return (
    <motion.section
      className={styles.hero}
      aria-label="Your profile"
      initial={{ opacity: 0, y: 24, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.7, ease }}
    >
      <span className={styles.heroBlob} aria-hidden="true" />
      <span className={`${styles.heroBlob} ${styles.heroBlobAlt}`} aria-hidden="true" />
      <div className={styles.heroMain}>
        <motion.span className={styles.heroAvatar} initial={{ scale: 0.6, rotate: -8 }} animate={{ scale: 1, rotate: 0 }} transition={{ type: "spring", stiffness: 220, damping: 16, delay: 0.15 }}>
          <AccountAvatar user={user} />
        </motion.span>
        <div>
          <p className={styles.hello}>Hello,</p>
          <h2 className={styles.heroName}>{user.firstName} {user.lastName}</h2>
          <p className={styles.heroEmail}>{user.email}</p>
        </div>
      </div>
      <dl className={styles.stats}>
        {[
          { label: "Learning level", value: user.level },
          { label: "Active courses", value: String(active) },
          { label: "Member since", value: memberSince },
        ].map((stat, index) => (
          <motion.div key={stat.label} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease, delay: 0.25 + index * 0.08 }}>
            <dt>{stat.label}</dt>
            <dd>{stat.value}</dd>
          </motion.div>
        ))}
      </dl>
    </motion.section>
  );
}

export function AccountSettings() {
  const { user, loading } = useAuth();

  return (
    <MotionConfig reducedMotion="user">
      <main id="main-content" tabIndex={-1} className={styles.page}>
        <div className={styles.glow} aria-hidden="true" />
        <Reveal>
          <header className={styles.intro}>
            <p className={styles.eyebrow}>SETTINGS</p>
            <h1>My Account</h1>
            <p>Manage your profile, avatar and password.</p>
          </header>
        </Reveal>

        {loading ? (
          <div className={styles.skeleton} role="status" aria-label="Loading your account"><span /><span /><span /></div>
        ) : !user ? (
          <Reveal delay={0.1}>
            <section className={`${styles.card} ${styles.signedOut}`}>
              <h2>Log in to view your account</h2>
              <p className={styles.description}>Your profile and settings are saved to your SI Tutor account.</p>
              <Link className={styles.primary} href="/login?next=/my-account">Log in</Link>
            </section>
          </Reveal>
        ) : (
          <div className={styles.layout} key={user.id}>
            <aside className={styles.sidebar} aria-label="Account sections">
              <Reveal delay={0.1}>
                <nav className={styles.sideNav} aria-label="Account navigation">
                  <p className={styles.sideTitle}>Account</p>
                  <a href="#profile"><span className={styles.dot} style={{ background: "#7dd3fc" }} />Profile</a>
                  <a href="#password"><span className={styles.dot} style={{ background: "#a78bfa" }} />Password</a>
                  <p className={styles.sideTitle}>Learning</p>
                  <Link href="/my-courses"><span className={styles.dot} style={{ background: "#5eead4" }} />My Courses <span aria-hidden="true">›</span></Link>
                  <Link href="/pricing"><span className={styles.dot} style={{ background: "#fdba74" }} />Plans & Pricing <span aria-hidden="true">›</span></Link>
                </nav>
              </Reveal>
            </aside>
            <div className={styles.content}>
              <Hero user={user} />
              <Reveal delay={0.15}><ProfileForm user={user} /></Reveal>
              <Reveal delay={0.25}><PasswordForm /></Reveal>
            </div>
          </div>
        )}
      </main>
    </MotionConfig>
  );
}
