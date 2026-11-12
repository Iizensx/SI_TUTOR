import type { Metadata } from "next";

import { PricingPlans } from "./pricing-plans";

export const metadata: Metadata = {
  title: "Pricing | SI Tutor",
  description: "Compare the Free, Standard and Premium plans for SI Tutor.",
};

export default function PricingPage() {
  return <PricingPlans />;
}
