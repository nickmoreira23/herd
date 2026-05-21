import { NextResponse } from "next/server";
import { processPendingEvents } from "@/lib/domain-events/process-pending-events";

// Next.js 16 Cache Components: route handlers reading env or DB are
// auto-detected as dynamic. `export const dynamic = "force-dynamic"`
// is incompatible with `cacheComponents` (`next.config.ts`) and unnecessary.
// See AGENTS.md "Next.js 16 Cache Components conventions".

/**
 * Sub-etapa 12 — Cron trigger for the domain-events outbox worker.
 *
 * Pre-Sub-etapa 12 the worker existed only as a CLI script
 * (`npm run worker:domain-events`). Production had no automated trigger,
 * which meant `webhook.recharge` (and other) events accumulated in
 * `domain_events` indefinitely. This route closes the gap by invoking
 * `processPendingEvents` periodically via Railway's scheduler.
 *
 * Pattern: matches `events-sync`, `meetings-sync`, `knowledge-apps-sync`
 * cron routes — `GET` + `CRON_SECRET` bearer header. Single responsibility:
 * processes one batch (up to 50 events) per invocation.
 *
 * Auth: `Authorization: Bearer ${CRON_SECRET}` required. If `CRON_SECRET`
 * is unset the route logs a warning and proceeds — fail-open is a tech
 * debt rastreado em AGENTS.md (cron auth fail-open). Set the env var on
 * every external deploy.
 *
 * Tenancy: this route runs without an outer tenant context. Each handler
 * in `HANDLER_REGISTRY` opens its own `withTenant(event.aggregateId, ...)`
 * block, so RLS is enforced at the handler boundary.
 */
export async function GET(request: Request): Promise<Response> {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) {
    console.warn(
      "[cron:domain-events-sync] CRON_SECRET not set — proceeding without auth check (tech debt rastreado em AGENTS.md)",
    );
  } else {
    const authHeader = request.headers.get("authorization");
    if (authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
  }

  try {
    const result = await processPendingEvents({ limit: 50 });
    return NextResponse.json({
      status: "ok",
      picked: result.picked,
      succeeded: result.succeeded,
      failed: result.failed,
      noHandler: result.noHandler,
      exhausted: result.exhausted,
    });
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    console.error("[cron:domain-events-sync] Fatal:", errorMessage);
    return NextResponse.json(
      { status: "error", error: errorMessage },
      { status: 500 },
    );
  }
}
