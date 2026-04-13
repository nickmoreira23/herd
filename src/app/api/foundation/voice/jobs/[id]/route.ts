import { prisma } from "@/lib/prisma";
import { apiSuccess, apiError } from "@/lib/api-utils";

/**
 * GET /api/foundation/voice/jobs/[id]
 *
 * Get a voice job by ID. Returns status, result, and metadata.
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const job = await prisma.voiceJob.findUnique({ where: { id } });

  if (!job) {
    return apiError("Voice job not found", 404);
  }

  return apiSuccess({
    id: job.id,
    operation: job.operation,
    provider: job.provider,
    status: job.status,
    audioDurationSec: job.audioDurationSec,
    costCents: job.costCents,
    errorMessage: job.errorMessage,
    sourceType: job.sourceType,
    sourceId: job.sourceId,
    result: job.resultJson ? JSON.parse(job.resultJson) : null,
    outputUrl: job.outputUrl,
    createdAt: job.createdAt,
    completedAt: job.completedAt,
  });
}
