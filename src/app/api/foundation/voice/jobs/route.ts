import { prisma } from "@/lib/prisma";
import { apiSuccess } from "@/lib/api-utils";

/**
 * GET /api/foundation/voice/jobs
 *
 * List voice jobs with optional filters.
 * Query params: operation, status, sourceType, limit, offset
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const operation = url.searchParams.get("operation");
  const status = url.searchParams.get("status");
  const sourceType = url.searchParams.get("sourceType");
  const limit = Math.min(parseInt(url.searchParams.get("limit") ?? "50"), 100);
  const offset = parseInt(url.searchParams.get("offset") ?? "0");

  const where: Record<string, string> = {};
  if (operation) where.operation = operation;
  if (status) where.status = status;
  if (sourceType) where.sourceType = sourceType;

  const [jobs, total] = await Promise.all([
    prisma.voiceJob.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: limit,
      skip: offset,
    }),
    prisma.voiceJob.count({ where }),
  ]);

  return apiSuccess({
    jobs: jobs.map((j) => ({
      id: j.id,
      operation: j.operation,
      provider: j.provider,
      status: j.status,
      audioDurationSec: j.audioDurationSec,
      costCents: j.costCents,
      errorMessage: j.errorMessage,
      sourceType: j.sourceType,
      sourceId: j.sourceId,
      outputUrl: j.outputUrl,
      createdAt: j.createdAt,
      completedAt: j.completedAt,
    })),
    total,
    limit,
    offset,
  });
}
