import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { syncCalendarEvents } from "@/lib/events/event-sync";

// headers() forces dynamic rendering — opt-out of Next 16 Cache Components
// static caching. `noStore()` from `next/cache` is no-op in Next 16
// (Sub-etapa 17.0.6 confirmed via Railway prod). Canonical pattern in 17.0.7.

/**
 * GET — Scheduled sync for calendar events.
 *
 * Runs on a schedule (e.g., Vercel Cron every 15 minutes).
 * Pulls events from all connected calendars into the local database
 * for RAG searchability and UI rendering.
 *
 * Protected by CRON_SECRET header to prevent unauthorized access.
 */
export async function GET(request: Request) {
  // Reading from headers() (Dynamic API) opts the route out of static
  // caching; return value discarded — see module docblock.
  await headers();
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await syncCalendarEvents();
    return NextResponse.json(result);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Events sync failed";
    return NextResponse.json(
      { error: msg },
      { status: 500 }
    );
  }
}
