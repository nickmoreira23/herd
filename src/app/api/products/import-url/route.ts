import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { apiSuccess, apiError, parseAndValidate } from "@/lib/api-utils";

const importUrlSchema = z.object({
  name: z.string().min(1, "Name is required"),
  sku: z.string().min(1, "SKU is required"),
  category: z.enum(["SUPPLEMENT", "APPAREL", "ACCESSORY"]),
  subCategory: z.string().optional(),
  redemptionType: z.enum(["Members Store", "Members Rate"]).optional().default("Members Store"),
  retailPrice: z.coerce.number().positive("Retail price must be positive"),
  memberPrice: z.coerce.number().nonnegative().optional(),
  costOfGoods: z.coerce.number().nonnegative("COGS must be non-negative"),
  imageUrl: z.string().optional(),
  weightOz: z.coerce.number().nonnegative().optional(),
  tags: z.array(z.string()).optional(),
  // Extended fields
  description: z.string().optional(),
  brand: z.string().optional(),
  sourceUrl: z.string().url().optional(),
  flavor: z.string().optional(),
  variants: z.any().optional(),
  servingSize: z.string().optional(),
  servingsPerContainer: z.coerce.number().int().positive().optional(),
  ingredients: z.string().optional(),
  supplementFacts: z.any().optional(),
  warnings: z.string().optional(),
  // Images to create
  images: z
    .array(
      z.object({
        url: z.string().url(),
        alt: z.string().nullable().optional(),
        isPrimary: z.boolean().optional(),
      })
    )
    .optional(),
});

/**
 * POST /api/products/import-url
 * Creates a product from scraped data (after user review/edit).
 */
export async function POST(request: Request) {
  try {
    const result = await parseAndValidate(request, importUrlSchema);
    if ("error" in result) return result.error;

    const { images: imageList, ...productData } = result.data;

    // Check for duplicate SKU
    const existing = await prisma.product.findUnique({
      where: { sku: productData.sku },
    });
    if (existing) {
      return apiError(`A product with SKU "${productData.sku}" already exists`, 409);
    }

    // Set primary image from images list if not explicitly provided
    let primaryImageUrl = productData.imageUrl;
    if (!primaryImageUrl && imageList?.length) {
      const primary = imageList.find((i) => i.isPrimary) || imageList[0];
      primaryImageUrl = primary.url;
    }

    // Compute member price if not provided (default to retail)
    const memberPrice = productData.memberPrice ?? productData.retailPrice;

    const product = await prisma.$transaction(async (tx) => {
      const created = await tx.product.create({
        data: {
          ...productData,
          imageUrl: primaryImageUrl || undefined,
          memberPrice,
          scrapeStatus: productData.sourceUrl ? "READY" : undefined,
          lastScrapedAt: productData.sourceUrl ? new Date() : undefined,
        },
      });

      // Create product images
      if (imageList?.length) {
        await tx.productImage.createMany({
          data: imageList.map((img, idx) => ({
            productId: created.id,
            url: img.url,
            alt: img.alt || null,
            isPrimary: img.isPrimary ?? idx === 0,
            sortOrder: idx,
          })),
        });
      }

      return tx.product.findUnique({
        where: { id: created.id },
        include: { images: { orderBy: [{ isPrimary: "desc" }, { sortOrder: "asc" }] } },
      });
    });

    return apiSuccess(product, 201);
  } catch (e) {
    console.error("POST /api/products/import-url error:", e);
    return apiError("Failed to import product", 500);
  }
}
