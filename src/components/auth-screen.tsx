import Image from "next/image";
import Link from "next/link";
import { AuthForm } from "./auth-form";
import styles from "./auth.module.css";

export function AuthScreen({ mode, next }: { mode: "login" | "signup"; next: string }) {
  const signup = mode === "signup";
  return (
    <main id="main-content" tabIndex={-1} className={styles.page}>
      <div className={styles.topline}>
        <Link href="/subjects"><span aria-hidden="true">←</span> Explore subjects</Link>
        <span>Your next chapter starts here.</span>
      </div>
      <div className={styles.shell}>
        <aside className={styles.story} aria-label="Learn with SI Tutor">
          <div className={styles.eyebrow}><span /> A LITTLE CURIOSITY. LIMITLESS POSSIBILITIES.</div>
          <h2>Big dreams.<br />Brighter minds.<br /><span>Start with you.</span></h2>
          <p>From your first question to your next big breakthrough. Let’s learn beyond limits, together.</p>
          <div className={styles.illustration}>
            <span className={styles.orbit} aria-hidden="true" />
            <div className={styles.robotCircle}>
              <Image src="/home/robotics.jpg" alt="SI Tutor’s friendly robot exploring a robotic arm" width={750} height={717} sizes="(max-width: 760px) 200px, 350px" priority />
            </div>
            <span className={`${styles.subjectTag} ${styles.tagMath}`}><span aria-hidden="true">∑</span> Mathematics</span>
            <span className={`${styles.subjectTag} ${styles.tagAi}`}><span aria-hidden="true">✧</span> AI & Robotics</span>
            <span className={`${styles.subjectTag} ${styles.tagEnglish}`}><span aria-hidden="true">Aa</span> IELTS & more</span>
          </div>
          <div className={styles.storyFooter}>
            <span className={styles.smallIcon} aria-hidden="true">↗</span>
            <div><strong>Small steps. Real progress.</strong><span>Find your subject. Build your confidence.</span></div>
          </div>
        </aside>
        <section className={styles.formPanel} aria-labelledby="auth-title">
          <div className={styles.formInner}>
            <nav className={styles.tabs} aria-label="Account access">
              <Link href={`/login?next=${encodeURIComponent(next)}`} aria-current={!signup ? "page" : undefined}>Log in</Link>
              <Link href={`/signup?next=${encodeURIComponent(next)}`} aria-current={signup ? "page" : undefined}>Sign up</Link>
            </nav>
            <div className={styles.formHeading}>
              <span className={styles.kicker}>{signup ? "LET’S GET YOU STARTED" : "YOUR LEARNING JOURNEY CONTINUES"}</span>
              <h1 id="auth-title">{signup ? "Create your account" : "Welcome back"}<span>.</span></h1>
              <p>{signup ? "A world of learning is waiting for you." : "Ready for your next breakthrough? Log in to keep learning."}</p>
            </div>
            <AuthForm key={mode} mode={mode} next={next} />
          </div>
        </section>
      </div>
      <footer className={styles.footer}><span>© 2026 SI Tutor</span><span>Learn at your pace. Grow beyond limits.</span></footer>
    </main>
  );
}
