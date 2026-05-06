import { notFound } from "next/navigation";
import { isFeatureEnabled } from "@/lib/feature-flags";
import { PrepPlanClient } from "@/components/tools/meeting-prep/prep-plan-client";

export default async function MeetingPrepPlanPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  if (!isFeatureEnabled("MEETING_PREP")) notFound();
  const { id } = await params;
  return <PrepPlanClient sessionId={id} />;
}
