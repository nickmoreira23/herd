import { CategoryHub } from "@/components/integrations/category-hub";
import { connection } from "next/server";

export default async function SocialMediaIntegrationsPage() {
  await connection();
  return <CategoryHub category="SOCIAL_MEDIA" />;
}
