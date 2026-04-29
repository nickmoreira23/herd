import { prisma } from "@/lib/prisma";
import { blockRegistry } from "@/lib/blocks/registry";

/**
 * Normalized "view-model" for a Marketplace item detail page.
 * The renderer is block-agnostic — adding a new block detail = teaching
 * `resolveItemDetail` how to project that block's row into this shape.
 */
export interface ItemDetailFact {
  label: string;
  value: string;
}

export interface ItemDetailSection {
  heading: string;
  /** Free-form blocks. Renderer picks the right view per `kind`. */
  kind: "text" | "facts" | "list" | "supplementFacts" | "variants" | "table";
  content: unknown;
}

export interface ItemDetailGalleryEntry {
  url: string;
  alt?: string | null;
  isPrimary?: boolean;
}

export interface ItemDetail {
  blockName: string;
  blockDisplayName: string;
  itemId: string;
  type: string;
  name: string;
  description: string | null;
  longDescription: string | null;
  status: string | null;
  /** Big top-level facts shown next to the gallery (price, category, brand…). */
  primaryFacts: ItemDetailFact[];
  gallery: ItemDetailGalleryEntry[];
  tags: string[];
  /** Long-form content blocks below the hero. */
  sections: ItemDetailSection[];
  /** Optional CTA target (set by future phases — buy/inquire/etc.). */
  cta?: { label: string; href?: string } | null;
}

// ─── Helpers ──────────────────────────────────────────────────

function fmtMoney(v: unknown): string | null {
  if (v === null || v === undefined) return null;
  const n = typeof v === "number" ? v : Number(v.toString());
  if (!Number.isFinite(n)) return null;
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(n);
}

function notEmpty<T>(x: T | null | undefined): x is T {
  return x !== null && x !== undefined && x !== "";
}

// ─── Per-block resolvers ──────────────────────────────────────

async function resolveProduct(itemId: string): Promise<ItemDetail | null> {
  const product = await prisma.product.findUnique({
    where: { id: itemId },
    include: { images: { orderBy: [{ isPrimary: "desc" }, { sortOrder: "asc" }] } },
  });
  if (!product) return null;

  const block = blockRegistry.get("products");
  const blockDisplayName = block?.displayName ?? "Products";

  const gallery: ItemDetailGalleryEntry[] = [];
  for (const img of product.images) {
    gallery.push({ url: img.url, alt: img.alt, isPrimary: img.isPrimary });
  }
  // Always include the primary `imageUrl` as a fallback if no ProductImage rows.
  if (gallery.length === 0 && product.imageUrl) {
    gallery.push({ url: product.imageUrl, alt: product.name, isPrimary: true });
  }

  const primaryFacts: ItemDetailFact[] = [];
  const retail = fmtMoney(product.retailPrice);
  const member = fmtMoney(product.memberPrice);
  if (retail) primaryFacts.push({ label: "Retail price", value: retail });
  if (member && member !== retail)
    primaryFacts.push({ label: "Member price", value: member });
  if (product.brand) primaryFacts.push({ label: "Brand", value: product.brand });
  primaryFacts.push({ label: "Category", value: product.category });
  if (product.subCategory)
    primaryFacts.push({ label: "Sub-category", value: product.subCategory });
  primaryFacts.push({ label: "SKU", value: product.sku });
  if (product.weightOz)
    primaryFacts.push({
      label: "Weight",
      value: `${Number(product.weightOz).toFixed(2)} oz`,
    });
  if (product.flavor) primaryFacts.push({ label: "Flavor", value: product.flavor });
  if (product.servingSize)
    primaryFacts.push({ label: "Serving size", value: product.servingSize });
  if (product.servingsPerContainer)
    primaryFacts.push({
      label: "Servings per container",
      value: String(product.servingsPerContainer),
    });

  const sections: ItemDetailSection[] = [];

  // Variants (e.g. flavors)
  if (product.variants && Array.isArray(product.variants)) {
    sections.push({
      heading: "Variants",
      kind: "variants",
      content: product.variants,
    });
  }

  if (product.ingredients) {
    sections.push({
      heading: "Ingredients",
      kind: "text",
      content: product.ingredients,
    });
  }

  if (product.supplementFacts && Array.isArray(product.supplementFacts)) {
    sections.push({
      heading: "Supplement facts",
      kind: "supplementFacts",
      content: product.supplementFacts,
    });
  }

  if (product.warnings) {
    sections.push({
      heading: "Warnings",
      kind: "text",
      content: product.warnings,
    });
  }

  // Detailed cost / margin info — useful in admin preview but harmless public.
  const costFacts: ItemDetailFact[] = [
    notEmpty(fmtMoney(product.costOfGoods)) && {
      label: "Cost of goods",
      value: fmtMoney(product.costOfGoods)!,
    },
    Number(product.shippingCost) > 0 && {
      label: "Shipping cost",
      value: fmtMoney(product.shippingCost)!,
    },
    Number(product.handlingCost) > 0 && {
      label: "Handling cost",
      value: fmtMoney(product.handlingCost)!,
    },
    product.mapPrice
      ? { label: "Min. advertised price", value: fmtMoney(product.mapPrice)! }
      : null,
    Number(product.paymentProcessingPct) > 0 && {
      label: "Payment processing %",
      value: `${Number(product.paymentProcessingPct).toFixed(2)}%`,
    },
    Number(product.paymentProcessingFlat) > 0 && {
      label: "Payment processing flat",
      value: fmtMoney(product.paymentProcessingFlat)!,
    },
  ].filter(notEmpty) as ItemDetailFact[];
  if (costFacts.length > 0) {
    sections.push({
      heading: "Cost & margin",
      kind: "facts",
      content: costFacts,
    });
  }

  if (product.sourceUrl) {
    sections.push({
      heading: "Source",
      kind: "list",
      content: [{ label: "Original page", value: product.sourceUrl, href: product.sourceUrl }],
    });
  }

  return {
    blockName: "products",
    blockDisplayName,
    itemId: product.id,
    type: "product",
    name: product.name,
    description: product.description,
    longDescription: null,
    status: product.isActive ? "Active" : "Inactive",
    primaryFacts,
    gallery,
    tags: product.tags ?? [],
    sections,
    cta: null,
  };
}

async function resolveAgent(itemId: string): Promise<ItemDetail | null> {
  const agent = await prisma.agent.findUnique({
    where: { id: itemId },
    include: {
      skills: { take: 30 },
      tools: { take: 30 },
    },
  });
  if (!agent) return null;

  const block = blockRegistry.get("agents");
  const blockDisplayName = block?.displayName ?? "AI Agents";

  const gallery: ItemDetailGalleryEntry[] = [];
  if (agent.iconUrl) gallery.push({ url: agent.iconUrl, alt: agent.name });

  const primaryFacts: ItemDetailFact[] = [
    { label: "Category", value: String(agent.category) },
    { label: "Status", value: String(agent.status) },
    { label: "Type", value: String(agent.modelType) },
  ];
  if (agent.modelProvider)
    primaryFacts.push({ label: "Provider", value: agent.modelProvider });
  if (agent.modelId) primaryFacts.push({ label: "Model", value: agent.modelId });

  const sections: ItemDetailSection[] = [];

  if (agent.longDescription) {
    sections.push({
      heading: "About",
      kind: "text",
      content: agent.longDescription,
    });
  }

  if (agent.skills.length > 0) {
    sections.push({
      heading: "Skills",
      kind: "list",
      content: agent.skills.map((s) => ({ label: s.name, value: s.description ?? "" })),
    });
  }

  if (agent.tools.length > 0) {
    sections.push({
      heading: "Tools",
      kind: "list",
      content: agent.tools.map((t) => ({ label: t.name, value: t.description ?? "" })),
    });
  }

  return {
    blockName: "agents",
    blockDisplayName,
    itemId: agent.id,
    type: "agent",
    name: agent.name,
    description: agent.description,
    longDescription: agent.longDescription,
    status: String(agent.status),
    primaryFacts,
    gallery,
    tags: [],
    sections,
    cta: null,
  };
}

// Generic fallback — uses the DataProvider catalog when no per-block
// resolver exists yet. Limited to what ArtifactMeta exposes.
async function resolveGeneric(
  blockName: string,
  itemId: string
): Promise<ItemDetail | null> {
  const block = blockRegistry.get(blockName);
  if (!block || block.types.length === 0) return null;
  const { providers } = await import("@/lib/chat/data-retrieval");
  const provider = providers.find((p) =>
    p.types.some((t) => block.types.includes(t))
  );
  if (!provider) return null;
  const metas = await provider.getArtifactMeta([itemId]);
  const meta = metas[0];
  if (!meta) return null;

  const primaryFacts: ItemDetailFact[] = [];
  if (meta.category) primaryFacts.push({ label: "Category", value: meta.category });
  if (meta.status) primaryFacts.push({ label: "Status", value: meta.status });
  for (const [k, v] of Object.entries(meta.meta ?? {})) {
    if (typeof v === "string" && v) primaryFacts.push({ label: k, value: v });
    else if (typeof v === "number") primaryFacts.push({ label: k, value: String(v) });
  }

  return {
    blockName,
    blockDisplayName: block.displayName,
    itemId,
    type: meta.type,
    name: meta.name,
    description: meta.description ?? null,
    longDescription: null,
    status: meta.status ?? null,
    primaryFacts,
    gallery: meta.imageUrl ? [{ url: meta.imageUrl, alt: meta.name }] : [],
    tags: [],
    sections: [],
    cta: null,
  };
}

// ─── Entry point ──────────────────────────────────────────────

export async function resolveItemDetail(
  blockName: string,
  itemId: string
): Promise<ItemDetail | null> {
  switch (blockName) {
    case "products":
      return resolveProduct(itemId);
    case "agents":
      return resolveAgent(itemId);
    default:
      return resolveGeneric(blockName, itemId);
  }
}
