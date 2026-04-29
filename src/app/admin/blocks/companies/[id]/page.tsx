import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { CompanyDetailClient } from "@/components/companies/company-detail-client";
import type { CompanyDetail } from "@/components/companies/types";

export default async function CompanyDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const company = await prisma.company.findUnique({
    where: { id },
    include: {
      _count: { select: { contacts: true } },
      contacts: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          jobTitle: true,
        },
        orderBy: { firstName: "asc" },
        take: 100,
      },
    },
  });
  if (!company) notFound();

  const serialized: CompanyDetail = {
    ...company,
    contentJson: company.contentJson,
    contactCount: company._count.contacts,
    contacts: company.contacts,
    createdAt: company.createdAt.toISOString(),
    updatedAt: company.updatedAt.toISOString(),
  };

  return <CompanyDetailClient company={serialized} />;
}
