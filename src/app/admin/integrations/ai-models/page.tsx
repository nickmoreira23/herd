import { CategoryHub } from "@/components/integrations/category-hub";
import { connection } from "next/server";

export default async function AIModelsIntegrationsPage() {
  await connection();
  return <CategoryHub category="AI_MODELS" />;
}
