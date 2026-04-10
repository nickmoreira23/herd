import { prisma } from "@/lib/prisma";
import { IntegrationsPageClient } from "@/components/integrations/integrations-page-client";

export default async function IntegrationsPage() {
  const integrations = await prisma.integration.findMany({
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
      title="All Integrations"
      description="Connect third-party services to extend your platform."
    />
  );
}
