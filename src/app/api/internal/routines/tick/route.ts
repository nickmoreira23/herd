import { prisma } from "@/lib/prisma";
import { apiSuccess, apiError } from "@/lib/api-utils";
import { runRoutine, refreshNextRunAt } from "@/lib/routines/runner";

const TICK_BATCH_QUEUE = 50;
const TICK_BATCH_DRAIN = 10;

/**
 * Internal cron tick. Hit by an external scheduler (Railway Cron, Vercel
 * Cron, k8s CronJob, etc.) every minute with a Bearer token equal to
 * `INTERNAL_TICK_SECRET`.
 *
 * Two responsibilities:
 *  1. Find SCHEDULE routines whose `nextRunAt` has passed and enqueue runs.
 *  2. Drain a small batch of QUEUED runs by calling the runner.
 *
 * Concurrency-safe: each step uses `FOR UPDATE SKIP LOCKED` so multiple
 * processes can poke the endpoint without duplicating work.
 */
async function handleTick() {
  const secret = process.env.INTERNAL_TICK_SECRET;
  if (!secret) {
    return apiError("INTERNAL_TICK_SECRET not configured", 503);
  }

  // 1. Enqueue due SCHEDULE runs ─────────────────────────────────
  // Prisma keeps field names as columns (camelCase). Postgres folds unquoted
  // identifiers to lowercase, so the column names must be double-quoted.
  const due = await prisma.$queryRaw<{ id: string }[]>`
    SELECT id FROM routines
    WHERE status = 'ACTIVE'
      AND "triggerType" = 'SCHEDULE'
      AND "nextRunAt" IS NOT NULL
      AND "nextRunAt" <= NOW()
    ORDER BY "nextRunAt" ASC
    LIMIT ${TICK_BATCH_QUEUE}
    FOR UPDATE SKIP LOCKED
  `;

  let enqueued = 0;
  for (const { id } of due) {
    await prisma.routineRun.create({
      data: {
        routineId: id,
        triggerSource: "SCHEDULE",
      },
    });
    await refreshNextRunAt(id);
    enqueued++;
  }

  // 2. Drain a slice of QUEUED runs ──────────────────────────────
  const queued = await prisma.$queryRaw<{ id: string }[]>`
    SELECT id FROM routine_runs
    WHERE status = 'QUEUED'
    ORDER BY "scheduledFor" ASC
    LIMIT ${TICK_BATCH_DRAIN}
    FOR UPDATE SKIP LOCKED
  `;

  let drained = 0;
  for (const { id } of queued) {
    await runRoutine(id);
    drained++;
  }

  return apiSuccess({ enqueued, drained });
}

function authorized(request: Request): boolean {
  const expected = process.env.INTERNAL_TICK_SECRET;
  if (!expected) return false;
  const header = request.headers.get("authorization");
  return header === `Bearer ${expected}`;
}

export async function POST(request: Request) {
  if (!authorized(request)) return apiError("Unauthorized", 401);
  try {
    return await handleTick();
  } catch (e) {
    console.error("[routines/tick] error:", e);
    return apiError("Tick failed", 500);
  }
}

// GET also supported for ease of curl-debugging from a terminal.
export async function GET(request: Request) {
  if (!authorized(request)) return apiError("Unauthorized", 401);
  try {
    return await handleTick();
  } catch (e) {
    console.error("[routines/tick] error:", e);
    return apiError("Tick failed", 500);
  }
}
