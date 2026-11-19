// Pricing plans. Every plan includes 3 months of access.
export type PlanId = "single" | "bundle" | "all-access";

export type Plan = {
  id: PlanId;
  name: string;
  tagline: string;
  badge: string;
  price: number;
  originalPrice?: number;
  unit: string;
  description: string;
  features: { text: string; included: boolean }[];
  cta: string;
  href: string;
};

export const plans: Plan[] = [
  {
    id: "single",
    name: "Single Course",
    tagline: "One course",
    badge: "Standard",
    price: 29,
    unit: "/ 1 course",
    description: "For learners who want to go deep into one subject they care about.",
    features: [
      { text: "Access to 1 course of your choice", included: true },
      { text: "3 months of access", included: true },
      { text: "Every video lesson included", included: true },
      { text: "Downloadable study files", included: true },
      { text: "Learning progress tracking", included: true },
      { text: "No discount on additional courses", included: false },
      { text: "Other courses in the same category not included", included: false },
    ],
    cta: "Enroll Now",
    href: "/subjects",
  },
  {
    id: "bundle",
    name: "3-Course Bundle",
    tagline: "Best for focused learners",
    badge: "Save 20% • Popular",
    price: 69,
    originalPrice: 87,
    unit: "/ 3 courses",
    description: "Choose any 3 courses at a lower price — just $23 per course.",
    features: [
      { text: "Choose any 3 courses (mix categories)", included: true },
      { text: "3 months of access for every course you pick", included: true },
      { text: "Every video lesson included", included: true },
      { text: "Downloadable study files", included: true },
      { text: "Learning progress tracking", included: true },
      { text: "Save $18 instantly", included: true },
      { text: "Courses beyond your 3 picks not included", included: false },
    ],
    cta: "Get 3-Course Bundle",
    href: "/pricing/checkout/bundle",
  },
  {
    id: "all-access",
    name: "All-Access Pass",
    tagline: "Learn everything",
    badge: "Best Value",
    price: 149,
    unit: "/ all courses",
    description: "Unlock every course on SI Tutor, with no limits on categories.",
    features: [
      { text: "Every course: HSC, IELTS, Robotics, Uni Maths & more", included: true },
      { text: "3 months of access from the day you join", included: true },
      { text: "All video lessons and study files", included: true },
      { text: "Progress tracking across every course", included: true },
      { text: "New courses added during your 3 months", included: true },
      { text: "Best value if you take 6 or more courses", included: true },
    ],
    cta: "Unlock All Courses",
    href: "/pricing/checkout/all-access",
  },
];

export function getPlan(id: string) {
  return plans.find((plan) => plan.id === id);
}
