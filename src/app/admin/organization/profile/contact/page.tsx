import { prisma } from "@/lib/prisma";
import { ContactInformationForm } from "@/components/organization/contact-information-form";
import { connection } from "next/server";

export default async function ContactInformationPage() {
  await connection();
  const settings = await prisma.setting.findMany({
    orderBy: { key: "asc" },
  });

  const map: Record<string, string> = {};
  for (const s of settings) {
    map[s.key] = String(s.value ?? "");
  }

  return <ContactInformationForm initialSettings={map} />;
}
