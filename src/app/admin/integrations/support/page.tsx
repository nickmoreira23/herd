import { CategoryHub } from "@/components/integrations/category-hub";
import { connection } from "next/server";

export default async function SupportIntegrationsPage() {
  await connection();
  return <CategoryHub category="SUPPORT" />;
}
