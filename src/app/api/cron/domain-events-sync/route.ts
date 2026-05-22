import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { processPendingEvents } from "@/lib/domain-events/process-pending-events";

// Next.js 16 Cache Components quirk — cron GET handlers (Sub-etapa 17.0.7):
//
// `unstable_noStore()` from `next/cache` (tried in Sub-etapa 17.0.6) is a
// no-op in Next 16 + Cache Components. Railway prod confirmed: even after
// deploy with `noStore()`, edge still served `x-nextjs-cache: HIT` with
// `cache-control: s-maxage=31536000`, body `{picked:0, succeeded:0, ...}`
// for ~25 minutes despite pending events in DB. `request.headers.get(...)`
// from the GET param also does not opt-out of caching.
//
// **Canonical opt-out in Next 16: `headers()` from `next/headers`.**
//
// Reading from `headers()` is a Dynamic API — it forces the route to
// render dynamically per-request. The CDN/edge cannot prerender the
// response because the actual header values come from the runtime
// request, not build time.
//
// This file demonstrates the pattern; all 4 cron routes (`events-sync`,
// `meetings-sync`, `knowledge-apps-sync`) use the same approach.
//
// `export const dynamic = "force-dynamic"` is NOT used — incompatible
// with `cacheComponents: true` in next.config.ts (build fails).
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
  // Opt-out of static caching: reading from `headers()` (a Dynamic API)
  // signals Next.js to treat the route as dynamic per-request. The return
  // value is intentionally discarded — `request.headers.get(...)` below
  // does the actual extraction. See module docblock for the rationale.
  await headers();

  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) {
    console.warn(
      "[cron:domain-events-sync] CRON_SECRET not set — proceeding without auth check (tech debt rastreado em AGENTS.md)",
    );
  } else if (authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
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
