import { CategoryHub } from "@/components/integrations/category-hub";
import { connection } from "next/server";

export default async function ProjectManagementIntegrationsPage() {
  await connection();
  return <CategoryHub category="PROJECT_MANAGEMENT" />;
}
