"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, useSyncExternalStore } from "react";

import styles from "./pricing.module.css";

const plans = [
  {
    id: "free",
    name: "Free",
    description: "Explore SI Tutor at your own pace.",
    monthlyCents: 0,
    features: ["Free course access", "Preview premium lessons", "Progress tracking"],
  },
  {
    id: "standard",
    name: "Standard",
    description: "The full learning experience for students.",
    monthlyCents: 1900,
    features: ["Unlimited course access", "Quizzes and assignments", "Offline downloads", "Access on all devices"],
  },
  {
    id: "premium",
    name: "Premium",
    description: "Extra tools for more guided learning.",
    monthlyCents: 4900,
    features: ["Everything in Standard", "Priority support", "AI Tutor assistance", "Live expert classes"],
  },
] as const;

const comparison = [
  ["Course access", "Limited", "Unlimited", "Unlimited"],
  ["Quizzes & practice", "Basic", true, true],
  ["Offline downloads", false, true, true],
  ["Certificates", false, true, true],
  ["Support", false, "Standard", "Priority"],
  ["AI Tutor", false, false, "Planned"],
  ["Live classes", false, false, "Planned"],
] as const;

const interestKey = "si-tutor:pricing-interest";
const interestEvent = "si-tutor:pricing-interest-change";

function subscribeToInterest(onChange: () => void) {
  window.addEventListener("storage", onChange);
  window.addEventListener(interestEvent, onChange);

  return () => {
    window.removeEventListener("storage", onChange);
    window.removeEventListener(interestEvent, onChange);
  };
}

function readInterest() {
  try {
    return window.localStorage.getItem(interestKey);
  } catch {
    return null;
  }
}

function getServerInterest() {
  return null;
}

function formatPrice(cents: number) {
  const price = cents / 100;
  return "$" + (Number.isInteger(price) ? price : price.toFixed(2));
}

function CheckMark() {
  return (
    <svg className={styles.check} viewBox="0 0 18 18" aria-hidden="true">
      <circle cx="9" cy="9" r="9" fill="currentColor" />
      <path d="m5.3 9 2.4 2.4 4.9-4.9" fill="none" stroke="white" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.55" />
    </svg>
  );
}

export function PricingPlans() {
  const [yearly, setYearly] = useState(false);
  const [notice, setNotice] = useState("");
  const interest = useSyncExternalStore(subscribeToInterest, readInterest, getServerInterest);

  function updateInterest(planId: "standard" | "premium", name: string) {
    try {
      if (interest === planId) {
        window.localStorage.removeItem(interestKey);
        setNotice("Interest in " + name + " removed from this device.");
      } else {
        window.localStorage.setItem(interestKey, planId);
        setNotice("Interest in " + name + " saved on this device only.");
      }
      window.dispatchEvent(new Event(interestEvent));
    } catch {
      setNotice("Your browser could not save this preference.");
    }
  }

  return (
    <main id="main-content" tabIndex={-1} className={styles.page}>
      <div className={styles.intro}>
        <h1>Choose your plan</h1>
        <p>Get access to quality courses and take your learning to the next level.</p>
        <fieldset className={styles.billingOptions}>
          <legend className={styles.visuallyHidden}>Billing period</legend>
          <input className={styles.visuallyHidden} type="radio" name="billing" id="billing-monthly" value="monthly" checked={!yearly} onChange={() => setYearly(false)} />
          <input className={styles.visuallyHidden} type="radio" name="billing" id="billing-yearly" value="yearly" checked={yearly} onChange={() => setYearly(true)} />
          <label className={styles.billingLabel} htmlFor="billing-monthly">Monthly</label>
          <label className={styles.billingTrack} htmlFor={yearly ? "billing-monthly" : "billing-yearly"} aria-hidden="true" />
          <label className={styles.billingLabel} htmlFor="billing-yearly">Yearly</label>
          <span className={styles.savings}>Save 20%</span>
        </fieldset>

        <div className={styles.mascot}>
          <Image src="/catalog/brand-robot.jpg" alt="" width={144} height={144} />
          <span className={styles.mascotNote}>Best value <span aria-hidden="true">✦</span></span>
        </div>
      </div>

      <section className={styles.planSection} aria-label="Pricing plans">
        <p className={styles.availability}>Preview pricing. Paid plans are coming soon.</p>
        <div className={styles.planGrid}>
          {plans.map((plan) => {
            const monthlyCents = yearly ? plan.monthlyCents * 0.8 : plan.monthlyCents;
            const selected = interest === plan.id;

            return (
              <article className={plan.id === "standard" ? styles.featuredPlan : styles.plan} key={plan.id}>
                {plan.id === "standard" && <span className={styles.popular}>Most popular</span>}
                <h2>{plan.name}</h2>
                <p className={styles.planDescription}>{plan.description}</p>
                <div className={styles.price} aria-live="polite">
                  <p><strong>{formatPrice(monthlyCents)}</strong>{plan.id !== "free" && <span> / month</span>}</p>
                  <p className={styles.billingNote}>
                    {plan.id === "free" ? "Free to get started" : yearly ? formatPrice(monthlyCents * 12) + " billed yearly" : "Billed monthly"}
                  </p>
                </div>
                <ul className={styles.features}>
                  {plan.features.map((feature) => (
                    <li key={feature}><CheckMark /> {feature}</li>
                  ))}
                </ul>
                {plan.id === "free" ? (
                  <Link href="/subjects" className={styles.action}>Start Free</Link>
                ) : (
                  <button type="button" className={styles.action} aria-label={(selected ? "Remove interest in " : "Register interest in ") + plan.name} onClick={() => updateInterest(plan.id, plan.name)}>
                    {selected ? "Remove interest" : "Register interest"}
                  </button>
                )}
              </article>
            );
          })}
        </div>
        <p className={styles.interestNotice} role="status">{notice || "Plan interest is saved on this device."}</p>
      </section>

      <section className={styles.comparison} aria-labelledby="comparison-title">
        <h2 id="comparison-title">Detailed comparison</h2>
        <p className={styles.tableHint}>Scroll to compare all plans.</p>
        <div className={styles.tableScroll} tabIndex={0} role="region" aria-label="Plan feature comparison">
          <table>
            <thead>
              <tr>
                <th scope="col">Features</th>
                {plans.map((plan) => <th key={plan.id} scope="col">{plan.name}</th>)}
              </tr>
            </thead>
            <tbody>
              {comparison.map(([feature, ...values]) => (
                <tr key={feature}>
                  <th scope="row">{feature}</th>
                  {values.map((value, index) => (
                    <td key={plans[index].id}>
                      {value === true ? <><CheckMark /><span className={styles.visuallyHidden}>Included</span></> : value === false ? <><span aria-hidden="true">—</span><span className={styles.visuallyHidden}>Not included</span></> : value}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}
