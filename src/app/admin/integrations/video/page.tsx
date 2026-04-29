import { CategoryHub } from "@/components/integrations/category-hub";
import { connection } from "next/server";

export default async function VideoIntegrationsPage() {
  await connection();
  return <CategoryHub category="VIDEO" />;
}
