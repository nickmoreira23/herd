import { CategoryHub } from "@/components/integrations/category-hub";
import { connection } from "next/server";

export default async function VoiceIntegrationsPage() {
  await connection();
  return <CategoryHub category="VOICE" />;
}
