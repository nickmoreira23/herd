import { notFound } from "next/navigation";
import { isFeatureEnabled } from "@/lib/feature-flags";
import { MeetingPrepNewClient } from "@/components/tools/meeting-prep/meeting-prep-new-client";

export default function MeetingPrepNewPage() {
  if (!isFeatureEnabled("MEETING_PREP")) notFound();
  return <MeetingPrepNewClient />;
}
