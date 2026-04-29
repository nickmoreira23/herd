import { Suspense } from "react";
import { prisma } from "@/lib/prisma";
import { CompaniesClient } from "@/components/companies/companies-client";
import type { CompanyRow } from "@/components/companies/types";
import CompaniesLoading from "./loading";
import { connection } from "next/server";

async function CompaniesContent() {
  await connection();
  const companies = await prisma.company.findMany({
    include: { _count: { select: { contacts: true } } },
    orderBy: { name: "asc" },
    take: 500,
  });

  const serialized: CompanyRow[] = companies.map((c) => ({
    ...c,
    contentJson: c.contentJson,
    contactCount: c._count.contacts,
    createdAt: c.createdAt.toISOString(),
    updatedAt: c.updatedAt.toISOString(),
  }));

  return <CompaniesClient initialCompanies={serialized} />;
}

export default function CompaniesPage() {
  return (
    <Suspense fallback={<CompaniesLoading />}>
      <CompaniesContent />
    </Suspense>
  );
}
