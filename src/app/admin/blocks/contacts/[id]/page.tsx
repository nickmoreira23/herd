import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { ContactDetailClient } from "@/components/contacts/contact-detail-client";
import type { ContactRow } from "@/components/contacts/types";

export default async function ContactDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const contact = await prisma.contact.findUnique({ where: { id } });
  if (!contact) notFound();

  const serialized: ContactRow = {
    ...contact,
    contentJson: contact.contentJson,
    birthday: contact.birthday?.toISOString() ?? null,
    createdAt: contact.createdAt.toISOString(),
    updatedAt: contact.updatedAt.toISOString(),
  };

  return <ContactDetailClient contact={serialized} />;
}
