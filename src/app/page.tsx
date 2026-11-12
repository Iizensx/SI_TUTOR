import Image from "next/image";
import Link from "next/link";

import { subjects } from "@/lib/catalog";

function FooterBrand() {
  return (
    <a className="brand" href="#home">
      <svg className="brand-mark" viewBox="0 0 60 44" aria-hidden="true">
        <path fill="#073674" d="M13 19v12c0 4 8 8 17 8s17-4 17-8V19L30 11z" />
        <path fill="#145eb6" d="M2 15 30 3l28 12-28 13z" />
        <path fill="#093d88" d="m2 15 28 10 28-10-28 13z" />
        <path d="m30 14-24 8v10" fill="none" stroke="#073674" strokeWidth="2" strokeLinecap="round" />
        <circle cx="6" cy="33" r="2.5" fill="#073674" />
      </svg>
      <span className="brand-copy">
        <span className="brand-name"><span>SI</span> TUTOR</span>
        <span className="brand-tagline">
          Super Intelligence Tutor · Learn Beyond Limits.
        </span>
      </span>
    </a>
  );
}

export default function Home() {
  return (
    <div className="home-shell" id="home">
      <main id="main-content" tabIndex={-1}>
        <Image
          className="hero-image"
          src="/home/hero.jpg"
          alt="SI Tutor’s robot at a desk surrounded by colorful panels for its five subject categories."
          width={1649}
          height={954}
          sizes="(max-width: 1280px) 100vw, 1280px"
          preload
        />

        <section className="subjects" id="subjects" aria-labelledby="subjects-title">
          <h1 id="subjects-title">Choose a <span>Category</span></h1>
          <p className="subjects-intro">Explore the subjects you can learn with SI Tutor.</p>

          <div className="category-grid">
            {subjects.map(({ slug, name, description, image }) => (
              <Link key={slug} className={`category-card category-${slug}`} href={`/subjects/${slug}`}>
                <span className="category-art">
                  <Image src={image} alt="" width={280} height={132} sizes="(max-width: 560px) 160px, 240px" />
                </span>
                <span className="category-name">{name}</span>
                <span className="category-description">{description}</span>
                <span className="category-arrow" aria-hidden="true">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M4 12h15m-6-6 6 6-6 6" />
                  </svg>
                </span>
              </Link>
            ))}
          </div>
        </section>
      </main>

      <footer className="site-footer" id="about">
        <FooterBrand />
        <nav aria-label="Footer navigation">
          <a href="#home">Home</a>
          <Link href="/subjects">Subjects</Link>
        </nav>
        <p>© 2026 SI Tutor. All rights reserved.</p>
      </footer>
    </div>
  );
}
