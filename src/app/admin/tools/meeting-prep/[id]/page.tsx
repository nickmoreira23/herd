import { notFound } from "next/navigation";
import { isFeatureEnabled } from "@/lib/feature-flags";
import { BriefingWizard } from "@/components/tools/meeting-prep/briefing-wizard";

export default async function MeetingPrepSessionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  if (!isFeatureEnabled("MEETING_PREP")) notFound();
  const { id } = await params;
  return <BriefingWizard sessionId={id} />;
}
