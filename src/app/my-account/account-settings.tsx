"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";

import { AccountAvatar, avatarOptions, type AvatarColor } from "@/components/account-avatar";
import { useAuth } from "@/components/auth-provider";
import type { UserProfile } from "@/lib/auth-types";

import styles from "./account.module.css";

type Notice = { text: string; error: boolean } | null;

function Feedback({ notice }: { notice: Notice }) {
  if (!notice) return null;
  return <p className={styles.feedback} data-error={notice.error || undefined} role={notice.error ? "alert" : "status"}>{notice.text}</p>;
}

function ProfileForm({ user }: { user: UserProfile }) {
  const { updateAccount } = useAuth();
  const [firstName, setFirstName] = useState(user.firstName);
  const [lastName, setLastName] = useState(user.lastName);
  const [avatar, setAvatar] = useState<AvatarColor>(user.avatar ?? "blue");
  const [notice, setNotice] = useState<Notice>(null);
  const [busy, setBusy] = useState(false);

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
    <section className={styles.card} aria-labelledby="profile-title">
      <h2 id="profile-title">Account information</h2>
      <p className={styles.description}>Choose how your profile appears in SI Tutor.</p>
      <form onSubmit={save}>
        <fieldset disabled={busy}>
          <legend>Profile avatar</legend>
          <div className={styles.avatars}>
            {avatarOptions.map((color, index) => (
              <label key={color}>
                <input type="radio" name="avatar" value={color} checked={avatar === color} onChange={() => setAvatar(color)} />
                <span className={styles.choice}>
                  <AccountAvatar user={user} color={color} />
                  <span>Avatar {index + 1}</span>
                </span>
              </label>
            ))}
          </div>
          <div className={styles.fields}>
            <label>First name<input autoComplete="given-name" required maxLength={60} value={firstName} onChange={(event) => setFirstName(event.target.value)} /></label>
            <label>Last name<input autoComplete="family-name" required maxLength={60} value={lastName} onChange={(event) => setLastName(event.target.value)} /></label>
            <label className={styles.fullField}>Email address<input type="email" autoComplete="email" value={user.email} readOnly /></label>
          </div>
          <button type="submit" className={styles.primary}>{busy ? "Saving…" : "Save changes"}</button>
        </fieldset>
        <Feedback notice={notice} />
      </form>
    </section>
  );
}

function PasswordForm() {
  const { updateAccount } = useAuth();
  const [notice, setNotice] = useState<Notice>(null);
  const [busy, setBusy] = useState(false);

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const values = new FormData(form);
    setBusy(true);
    setNotice(null);
    try {
      await updateAccount({
        action: "password",
        currentPassword: values.get("currentPassword"),
        password: values.get("password"),
        confirmPassword: values.get("confirmPassword"),
      });
      form.reset();
      setNotice({ text: "Password updated.", error: false });
    } catch (cause) {
      setNotice({ text: cause instanceof Error ? cause.message : "Could not update your password.", error: true });
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className={styles.card} aria-labelledby="password-title">
      <h2 id="password-title">Password</h2>
      <p className={styles.description}>Use at least 8 characters, including a letter and a number.</p>
      <form onSubmit={save}>
        <fieldset disabled={busy} aria-label="Change password">
          <div className={styles.fields}>
            <label className={styles.fullField}>Current password<input type="password" name="currentPassword" autoComplete="current-password" required maxLength={128} /></label>
            <label>New password<input type="password" name="password" autoComplete="new-password" required minLength={8} maxLength={128} /></label>
            <label>Confirm new password<input type="password" name="confirmPassword" autoComplete="new-password" required minLength={8} maxLength={128} /></label>
          </div>
          <button type="submit" className={styles.secondary}>{busy ? "Updating…" : "Update password"}</button>
        </fieldset>
        <Feedback notice={notice} />
      </form>
    </section>
  );
}

export function AccountSettings() {
  const { user, loading } = useAuth();

  return (
    <main id="main-content" className={styles.page}>
      <header className={styles.intro}>
        <h1>My Account</h1>
        <p>Manage your profile and password.</p>
      </header>
      {loading ? <p role="status">Loading your account…</p> : !user ? (
        <section className={styles.card}>
          <h2>Log in to view your account</h2>
          <Link className={styles.primary} href="/login?next=/my-account">Log in</Link>
        </section>
      ) : (
        <div className={styles.layout} key={user.id}>
          <aside className={styles.sidebar} aria-label="Your account">
            <div className={styles.identity}>
              <AccountAvatar user={user} />
              <div><strong>{user.firstName} {user.lastName}</strong><p>{user.email}</p></div>
            </div>
            <nav aria-label="Account navigation">
              <Link href="/my-account" aria-current="page">My Account <span aria-hidden="true">›</span></Link>
              <Link href="/my-courses">My Courses <span aria-hidden="true">›</span></Link>
            </nav>
          </aside>
          <div className={styles.content}>
            <ProfileForm user={user} />
            <PasswordForm />
          </div>
        </div>
      )}
    </main>
  );
}
