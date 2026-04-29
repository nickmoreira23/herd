import { CategoryHub } from "@/components/integrations/category-hub";
import { connection } from "next/server";

export default async function AnalyticsIntegrationsPage() {
  await connection();
  return <CategoryHub category="ANALYTICS" />;
}
