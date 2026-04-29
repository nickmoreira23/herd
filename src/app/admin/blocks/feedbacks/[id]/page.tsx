import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { FeedbackDetailClient } from "@/components/feedbacks/feedback-detail-client";
import type { FeedbackRow } from "@/components/feedbacks/types";

export default async function FeedbackDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const feedback = await prisma.feedback.findUnique({ where: { id } });
  if (!feedback) notFound();

  const serialized: FeedbackRow = {
    ...feedback,
    contentJson: feedback.contentJson,
    resolvedAt: feedback.resolvedAt?.toISOString() ?? null,
    createdAt: feedback.createdAt.toISOString(),
    updatedAt: feedback.updatedAt.toISOString(),
  };

  return <FeedbackDetailClient feedback={serialized} />;
}
