import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { toNumber } from "@/lib/utils";
import { ProductDetailClient } from "@/components/products/product-detail-client";
import { connection } from "next/server";
import { getOrgIdFromRequest } from "@/lib/tenant/get-org-from-request";
import { withTenant } from "@/lib/tenancy/context";

export default async function EditProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await connection();
  const { id } = await params;
  if (id === "new") return notFound();

  // L1a.2 — Product is tenant-scoped: resolve under the host org.
  const orgId = await getOrgIdFromRequest();
  if (!orgId) return notFound();

  const product = await withTenant(orgId, () =>
    prisma.product.findUnique({
      where: { id },
      include: { images: { orderBy: [{ isPrimary: "desc" }, { sortOrder: "asc" }] } },
    })
  );
  if (!product) return notFound();

  const serialized = {
    ...product,
    retailPrice: toNumber(product.retailPrice),
    memberPrice: toNumber(product.memberPrice),
    costOfGoods: toNumber(product.costOfGoods),
    weightOz: product.weightOz ? toNumber(product.weightOz) : null,
  };

  return <ProductDetailClient productId={product.id} initialProduct={serialized as never} />;
}
