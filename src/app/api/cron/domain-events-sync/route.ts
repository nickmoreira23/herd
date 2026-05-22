import { unstable_noStore as noStore } from "next/cache";
import { NextResponse } from "next/server";
import { processPendingEvents } from "@/lib/domain-events/process-pending-events";

// Next.js 16 Cache Components quirk (Sub-etapa 17.0.6):
//
// Cron GET handlers can slip through the "env + DB auto-detect as dynamic"
// rule and get statically cached at Railway's edge — observed in prod with
// `cache-control: s-maxage=31536000` + `x-nextjs-cache: HIT`, returning the
// same `{picked:0, ...}` body for ~25 minutes. Likely cause: `dotenv` reads
// happen at module init (outside request scope) and `request.headers.get()`
// from the GET param does not reliably opt the route out of caching the
// way `headers()` from `next/headers` does.
//
// `noStore()` is the canonical hammer in Next 16: invoked at the top of
// the handler, it forces the route to be treated as fully dynamic — no
// cache, no static, no SWR. Apply on every cron endpoint until Next 16
// stabilizes a cleaner API (`connection()` is in some preview builds but
// not in our installed version).
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
  noStore();
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
