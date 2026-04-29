import { Suspense } from "react";
import { prisma } from "@/lib/prisma";
import { FeedbacksClient } from "@/components/feedbacks/feedbacks-client";
import type { FeedbackRow } from "@/components/feedbacks/types";
import FeedbacksLoading from "./loading";
import { connection } from "next/server";

async function FeedbacksContent() {
  await connection();
  const feedbacks = await prisma.feedback.findMany({
    orderBy: [{ voteCount: "desc" }, { updatedAt: "desc" }],
    take: 500,
  });

  const serialized: FeedbackRow[] = feedbacks.map((f) => ({
    ...f,
    contentJson: f.contentJson,
    resolvedAt: f.resolvedAt?.toISOString() ?? null,
    createdAt: f.createdAt.toISOString(),
    updatedAt: f.updatedAt.toISOString(),
  }));

  return <FeedbacksClient initialFeedbacks={serialized} />;
}

export default function FeedbacksPage() {
  return (
    <Suspense fallback={<FeedbacksLoading />}>
      <FeedbacksContent />
    </Suspense>
  );
}
