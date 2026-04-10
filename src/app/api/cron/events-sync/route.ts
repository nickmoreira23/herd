import { NextResponse } from "next/server";
import { syncCalendarEvents } from "@/lib/events/event-sync";

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
