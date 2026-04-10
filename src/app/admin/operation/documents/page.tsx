import { prisma } from "@/lib/prisma";
import { DocumentTable } from "@/components/operations/document-table";
import { formatNumber } from "@/lib/utils";

export default async function DocumentsPage() {
  const documents = await prisma.document.findMany({
    orderBy: { uploadedAt: "desc" },
  });

  const activeCount = documents.filter((d) => d.isActive).length;
  const categoryCount = new Set(documents.map((d) => d.category)).size;

  const stats = [
    { label: "Total Documents", value: formatNumber(documents.length) },
    { label: "Active", value: formatNumber(activeCount) },
    { label: "Categories", value: formatNumber(categoryCount) },
  ];

  return <DocumentTable initialDocuments={documents as never} stats={stats} />;
}
