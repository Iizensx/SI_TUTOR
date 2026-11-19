import { NextRequest, NextResponse } from "next/server";
import { allAccessSlug, type PaymentMethod, type PlanKind } from "@/lib/admin-types";
import { nextOrderId, updateAdminData } from "@/lib/server/admin-store";
import { getPublicCourses } from "@/lib/server/catalog-store";
import { readSession } from "@/lib/server/session";
import { findUser, setEnrollment } from "@/lib/server/user-repository";
import { getPlan } from "@/lib/plans";

export const runtime = "nodejs";

const methods: Record<string, PaymentMethod> = { "PayPal": "PayPal", "Stripe (card)": "Stripe", "Stripe": "Stripe", "Afterpay": "Afterpay" };

/** Demo checkout: records the order for the admin area and grants access. Prices come from the server, not the browser. */
export async function POST(request: NextRequest) {
  const origin = request.headers.get("origin");
  if (origin && origin !== request.nextUrl.origin) return NextResponse.json({ error: "This request is not allowed." }, { status: 403 });
  const { session } = readSession(request);
  const user = session ? await findUser(session.userId) : null;
  if (!user) return NextResponse.json({ error: "Please log in again." }, { status: 401 });

  try {
    const body = await request.json() as { plan?: string; slugs?: unknown; method?: string };
    const plan = (["single", "bundle", "all-access"].includes(body.plan ?? "") ? body.plan : "single") as PlanKind;
    const method = methods[body.method ?? ""] ?? "Stripe";
    const catalog = await getPublicCourses();
    const slugs = Array.isArray(body.slugs) ? [...new Set(body.slugs.filter((slug): slug is string => typeof slug === "string"))] : [];
    const chosen = slugs.map((slug) => catalog.find((course) => course.slug === slug)).filter((course) => course !== undefined);

    let items: { slug: string; title: string; price: number }[];
    let total: number;
    if (plan === "single") {
      if (chosen.length !== 1) return NextResponse.json({ error: "Choose one course." }, { status: 400 });
      items = [{ slug: chosen[0].slug, title: chosen[0].title, price: chosen[0].price }];
      total = chosen[0].price;
    } else if (plan === "bundle") {
      if (chosen.length !== 3) return NextResponse.json({ error: "Choose exactly 3 courses." }, { status: 400 });
      total = getPlan("bundle")!.price;
      items = chosen.map((course) => ({ slug: course.slug, title: course.title, price: Math.round((total / 3) * 100) / 100 }));
    } else {
      total = getPlan("all-access")!.price;
      items = [{ slug: allAccessSlug, title: "All-Access Pass", price: total }];
    }

    const expires = new Date();
    expires.setMonth(expires.getMonth() + 3);
    for (const item of items) {
      const current = user.enrollments.find((entry) => entry.courseSlug === item.slug)?.expiresAt;
      const keep = current && Date.parse(current) > expires.getTime() ? current : expires.toISOString();
      await setEnrollment(user.id, item.slug, keep);
    }

    const order = await updateAdminData((data) => {
      const created = {
        id: nextOrderId(data.orders), createdAt: new Date().toISOString(), studentId: user.id,
        studentName: `${user.firstName} ${user.lastName}`, studentEmail: user.email, plan, items, total, method,
        // Afterpay orders wait for an admin to confirm the payment.
        status: method === "Afterpay" ? "pending" as const : "paid" as const,
      };
      data.orders.unshift(created);
      return created;
    });
    return NextResponse.json({ order, user: await findUser(user.id) }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "We could not complete the order. Please try again." }, { status: 500 });
  }
}
