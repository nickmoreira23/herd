import { notFound } from "next/navigation";
import { isFeatureEnabled } from "@/lib/feature-flags";
import { SpecialistsPanelClient } from "@/components/tools/meeting-prep/specialists-panel-client";

export default async function MeetingPrepSpecialistsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  if (!isFeatureEnabled("MEETING_PREP")) notFound();
  const { id } = await params;
  return <SpecialistsPanelClient sessionId={id} />;
}
