import { notFound } from "next/navigation";
import { isFeatureEnabled } from "@/lib/feature-flags";
import { MeetingPrepListClient } from "@/components/tools/meeting-prep/meeting-prep-list-client";

export default function MeetingPrepListPage() {
  if (!isFeatureEnabled("MEETING_PREP")) notFound();
  return <MeetingPrepListClient />;
}
