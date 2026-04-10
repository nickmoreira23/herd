import { prisma } from "@/lib/prisma";
import { IntegrationsPageClient } from "@/components/integrations/integrations-page-client";

export default async function MeetingsIntegrationsPage() {
  const integrations = await prisma.integration.findMany({
    where: { category: "MEETINGS" },
    orderBy: { name: "asc" },
  });

  const connected = integrations.filter((i) => i.status === "CONNECTED");
  const available = integrations.filter((i) => i.status === "AVAILABLE");

  return (
    <IntegrationsPageClient
      initialIntegrations={JSON.parse(JSON.stringify(integrations))}
      stats={[
        { label: "Total", value: String(integrations.length) },
        { label: "Connected", value: String(connected.length) },
        { label: "Available", value: String(available.length) },
      ]}
      title="Meetings"
      description="Video conferencing and meeting integrations."
    />
  );
}
