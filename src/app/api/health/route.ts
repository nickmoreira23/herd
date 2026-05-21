import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Next.js 16 Cache Components: route handlers reading env or DB are
// auto-detected as dynamic. `export const dynamic = "force-dynamic"`
// is incompatible with `cacheComponents` (`next.config.ts`) and unnecessary.
// See AGENTS.md "Next.js 16 Cache Components conventions".

/**
 * Sub-etapa 12 — Health check endpoint for Railway and manual smoke tests.
 *
 * Returns 200 with operational signals JSON when the DB is reachable.
 * Returns 503 if the DB ping fails.
 *
 * Outbox signals exposed:
 *   - pending: events still pickable (processedAt NULL, nextAttemptAt set
 *     or attempts = 0)
 *   - exhausted: events with attempts >= MAX_ATTEMPTS (5) and no further
 *     retry scheduled — DLQ proxy
 *   - lastProcessedAt: timestamp of the most recent successfully-processed
 *     event (null if none yet)
 *
 * No `withTenant` block — this endpoint is tenant-less (admin/ops only).
 * The aggregate counts span all tenants by design.
 */
export async function GET(): Promise<Response> {
  try {
    await prisma.$queryRaw`SELECT 1`;

    const [pending, exhausted, lastProcessedRow] = await Promise.all([
      prisma.domainEvent.count({
        where: {
          processedAt: null,
          attempts: { lt: 5 },
        },
      }),
      prisma.domainEvent.count({
        where: {
          processedAt: null,
          attempts: { gte: 5 },
        },
      }),
      prisma.domainEvent.findFirst({
        where: { processedAt: { not: null } },
        orderBy: { processedAt: "desc" },
        select: { processedAt: true },
      }),
    ]);

    return NextResponse.json({
      status: "ok",
      timestamp: new Date().toISOString(),
      db: "connected",
      outbox: {
        pending,
        exhausted,
        lastProcessedAt: lastProcessedRow?.processedAt?.toISOString() ?? null,
      },
    });
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    return NextResponse.json(
      {
        status: "error",
        timestamp: new Date().toISOString(),
        error: errorMessage,
      },
      { status: 503 },
    );
  }
}
