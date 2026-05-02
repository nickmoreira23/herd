import { Suspense } from "react";
import { prisma } from "@/lib/prisma";
import { ContactsClient } from "@/components/contacts/contacts-client";
import type { ContactRow } from "@/components/contacts/types";
import ContactsLoading from "./loading";
import { connection } from "next/server";
import { ViewHandbookButtonByUid } from "@/components/handbook/view-handbook-button-by-uid";

async function ContactsContent() {
  await connection();
  const contacts = await prisma.contact.findMany({
    orderBy: { updatedAt: "desc" },
    take: 500,
  });

  const serialized: ContactRow[] = contacts.map((c) => ({
    ...c,
    contentJson: c.contentJson,
    birthday: c.birthday?.toISOString() ?? null,
    createdAt: c.createdAt.toISOString(),
    updatedAt: c.updatedAt.toISOString(),
  }));

  return (
    <ContactsClient
      initialContacts={serialized}
      headerActions={
        <ViewHandbookButtonByUid entryUid="herd.block.miscellaneous.contacts" />
      }
    />
  );
}

export default function ContactsPage() {
  return (
    <Suspense fallback={<ContactsLoading />}>
      <ContactsContent />
    </Suspense>
  );
}
