"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import { MotionConfig, animate, motion, useInView, useMotionValue, useTransform } from "framer-motion";
import type { Plan } from "@/lib/plans";
import styles from "./pricing.module.css";

const ease = [0.22, 1, 0.36, 1] as const;

function CountUp({ to, delay = 0 }: { to: number; delay?: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true });
  const value = useMotionValue(Math.round(to * 0.6));
  const rounded = useTransform(value, (latest) => Math.round(latest));
  useEffect(() => {
    if (!inView) return;
    const controls = animate(value, to, { duration: 1.1, delay, ease });
    return () => controls.stop();
  }, [inView, to, delay, value]);
  return (
    <span ref={ref} aria-label={`$${to}`}>
      $<motion.span aria-hidden="true">{rounded}</motion.span>
    </span>
  );
}

function Icon({ included }: { included: boolean }) {
  return included ? (
    <span className={styles.yes} aria-hidden="true">
      <svg viewBox="0 0 24 24"><path d="m6.5 12.5 3.6 3.6L17.5 8.7" /></svg>
    </span>
  ) : (
    <span className={styles.no} aria-hidden="true">
      <svg viewBox="0 0 24 24"><path d="m7 7 10 10M17 7 7 17" /></svg>
    </span>
  );
}

function PlanCard({ plan, index }: { plan: Plan; index: number }) {
  const featured = plan.id === "bundle";
  const card = (
    <article className={styles.card} data-plan={plan.id} aria-labelledby={`plan-${plan.id}`}>
      <span className={styles.badge}>
        {plan.badge}
        <i aria-hidden="true" />
      </span>
      <h2 id={`plan-${plan.id}`} className={styles.name}>{plan.name}</h2>

      <div className={styles.priceRow}>
        {plan.originalPrice && (
          <span className={styles.original}>
            <span className="sr-only">Was </span>${plan.originalPrice}
            <motion.i
              aria-hidden="true"
              initial={{ scaleX: 0 }}
              whileInView={{ scaleX: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, ease, delay: 0.9 }}
            />
          </span>
        )}
        <span className={styles.price}>
          {plan.originalPrice && <span className="sr-only">now </span>}
          <CountUp to={plan.price} delay={0.3 + index * 0.12} />
        </span>
        <span className={styles.unit}>
          {plan.unit}
          <small>AUD · 3 months access</small>
        </span>
      </div>

      <p className={styles.description}>{plan.description}</p>
      <hr className={styles.divider} />

      <ul className={styles.features}>
        {plan.features.map((feature, featureIndex) => (
          <motion.li
            key={feature.text}
            data-included={feature.included || undefined}
            initial={{ opacity: 0, x: -10 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, amount: 0.6 }}
            transition={{ duration: 0.4, ease, delay: 0.35 + featureIndex * 0.05 }}
          >
            <Icon included={feature.included} />
            <span>
              {!feature.included && <span className="sr-only">Not included: </span>}
              {feature.text}
            </span>
          </motion.li>
        ))}
      </ul>

      <Link href={plan.href} className={styles.cta}>
        {plan.cta}
        <span aria-hidden="true">→</span>
      </Link>
    </article>
  );

  return (
    <motion.div
      className={styles.cardWrap}
      data-plan={plan.id}
      initial={{ opacity: 0, y: 48 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.8, ease, delay: index * 0.12 }}
      whileHover={{ y: -8 }}
    >
      {featured ? <div className={styles.stripes}>{card}</div> : card}
    </motion.div>
  );
}

export function PricingPlans({ plans }: { plans: Plan[] }) {
  return (
    <MotionConfig reducedMotion="user">
      <div className={styles.header}>
        <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, ease }}>
          <p className={styles.eyebrow}>PLANS & PRICING</p>
          <h1 className={styles.title}>Pricing</h1>
          <p className={styles.lead}>Pick one course, bundle three, or unlock everything. Every plan includes 3 months of access.</p>
        </motion.div>
        <motion.div
          className={styles.accessPill}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, ease, delay: 0.2 }}
        >
          <span className={styles.pillActive}>3 months access</span>
          <span>Every plan</span>
        </motion.div>
      </div>

      <div className={styles.grid}>
        {plans.map((plan, index) => <PlanCard key={plan.id} plan={plan} index={index} />)}
      </div>
    </MotionConfig>
  );
}
