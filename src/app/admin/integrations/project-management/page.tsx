import { prisma } from "@/lib/prisma";
import { IntegrationsPageClient } from "@/components/integrations/integrations-page-client";
import { connection } from "next/server";

export default async function ProjectManagementIntegrationsPage() {
  await connection();
  const integrations = await prisma.integration.findMany({
    where: { category: "PROJECT_MANAGEMENT" },
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
      title="Project Management"
      description="Task and project management integrations."
    />
  );
}
