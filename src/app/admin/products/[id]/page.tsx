import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { toNumber } from "@/lib/utils";
import { ProductDetailClient } from "@/components/products/product-detail-client";

export default async function EditProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  if (id === "new") return notFound();

  const product = await prisma.product.findUnique({
    where: { id },
    include: { images: { orderBy: [{ isPrimary: "desc" }, { sortOrder: "asc" }] } },
  });
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
