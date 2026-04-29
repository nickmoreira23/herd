import { CategoryHub } from "@/components/integrations/category-hub";
import { connection } from "next/server";

export default async function CommunicationIntegrationsPage() {
  await connection();
  return <CategoryHub category="COMMUNICATION" />;
}
