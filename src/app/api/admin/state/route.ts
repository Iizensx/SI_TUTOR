import { NextRequest, NextResponse } from "next/server";
import { AdminAccessError, requireAdmin } from "@/lib/server/admin-auth";
import { buildAdminState } from "../state";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  try {
    const me = await requireAdmin(request);
    return NextResponse.json(await buildAdminState(me), { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    if (error instanceof AdminAccessError) return NextResponse.json({ error: error.message }, { status: error.status });
    return NextResponse.json({ error: "Could not load admin data." }, { status: 503 });
  }
}
