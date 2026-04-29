import { CategoryHub } from "@/components/integrations/category-hub";
import { connection } from "next/server";

export default async function PaymentIntegrationsPage() {
  await connection();
  return <CategoryHub category="PAYMENT" />;
}
