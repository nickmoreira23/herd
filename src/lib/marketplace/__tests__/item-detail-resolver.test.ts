import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    product: { findUnique: vi.fn() },
    agent: { findUnique: vi.fn() },
  },
}));

vi.mock("@/lib/blocks/registry", () => ({
  blockRegistry: new Map([
    ["products", { name: "products", displayName: "Products", types: ["product"] }],
    ["agents", { name: "agents", displayName: "AI Agents", types: ["agent"] }],
    ["perks", { name: "perks", displayName: "Perks", types: ["perk"] }],
    // a block with no types → resolveGeneric returns null
    ["empty", { name: "empty", displayName: "Empty", types: [] }],
  ]),
}));

// resolveGeneric dynamically imports data-retrieval; mock the providers list.
const genericProvider = {
  domain: "foundation",
  types: ["perk"],
  getArtifactMeta: vi.fn(),
};
vi.mock("@/lib/chat/data-retrieval", () => ({ providers: [genericProvider] }));

import { resolveItemDetail } from "../item-detail-resolver";
import { prisma } from "@/lib/prisma";

const mockProduct = vi.mocked(prisma.product.findUnique);
const mockAgent = vi.mocked(prisma.agent.findUnique);

beforeEach(() => vi.clearAllMocks());

describe("resolveItemDetail — products", () => {
  it("projects a product row into the ItemDetail view-model", async () => {
    mockProduct.mockResolvedValueOnce({
      id: "p-1",
      name: "Whey",
      description: "Protein",
      category: "supplements",
      subCategory: "protein",
      sku: "WP-1",
      brand: "Acme",
      retailPrice: 49.99,
      memberPrice: 39.99,
      costOfGoods: 10,
      shippingCost: 0,
      handlingCost: 0,
      paymentProcessingPct: 0,
      paymentProcessingFlat: 0,
      mapPrice: null,
      weightOz: null,
      flavor: null,
      servingSize: null,
      servingsPerContainer: null,
      variants: null,
      ingredients: null,
      supplementFacts: null,
      warnings: null,
      sourceUrl: null,
      imageUrl: "http://img/p1.jpg",
      isActive: true,
      tags: ["new"],
      images: [],
    } as never);

    const detail = await resolveItemDetail("products", "p-1");
    expect(detail).not.toBeNull();
    expect(detail!.blockName).toBe("products");
    expect(detail!.type).toBe("product");
    expect(detail!.name).toBe("Whey");
    expect(detail!.status).toBe("Active");
    // retail + member prices land in primaryFacts (money-formatted)
    const labels = detail!.primaryFacts.map((f) => f.label);
    expect(labels).toContain("Retail price");
    expect(labels).toContain("Member price");
    expect(labels).toContain("SKU");
    // gallery falls back to imageUrl when there are no ProductImage rows
    expect(detail!.gallery).toEqual([
      { url: "http://img/p1.jpg", alt: "Whey", isPrimary: true },
    ]);
  });

  it("exposes cost/margin facts (read-only) when present", async () => {
    mockProduct.mockResolvedValueOnce({
      id: "p-2",
      name: "X",
      description: null,
      category: "c",
      subCategory: null,
      sku: "X-1",
      brand: null,
      retailPrice: 10,
      memberPrice: 10,
      costOfGoods: 4,
      shippingCost: 2,
      handlingCost: 0,
      paymentProcessingPct: 2.9,
      paymentProcessingFlat: 0.3,
      mapPrice: 9,
      weightOz: null,
      flavor: null,
      servingSize: null,
      servingsPerContainer: null,
      variants: null,
      ingredients: null,
      supplementFacts: null,
      warnings: null,
      sourceUrl: null,
      imageUrl: null,
      isActive: false,
      tags: [],
      images: [],
    } as never);

    const detail = await resolveItemDetail("products", "p-2");
    const cost = detail!.sections.find((s) => s.heading === "Cost & margin");
    expect(cost).toBeDefined();
    expect(detail!.status).toBe("Inactive");
  });

  it("returns null when the product does not exist", async () => {
    mockProduct.mockResolvedValueOnce(null as never);
    expect(await resolveItemDetail("products", "missing")).toBeNull();
  });
});

describe("resolveItemDetail — agents", () => {
  it("projects an agent with skills + tools as list sections", async () => {
    mockAgent.mockResolvedValueOnce({
      id: "a-1",
      name: "Helper",
      description: "desc",
      longDescription: "long",
      category: "support",
      status: "active",
      modelType: "chat",
      modelProvider: "anthropic",
      modelId: "claude",
      iconUrl: "http://img/a.png",
      skills: [{ name: "S1", description: "d1" }],
      tools: [{ name: "T1", description: null }],
    } as never);

    const detail = await resolveItemDetail("agents", "a-1");
    expect(detail!.blockName).toBe("agents");
    expect(detail!.type).toBe("agent");
    const headings = detail!.sections.map((s) => s.heading);
    expect(headings).toContain("Skills");
    expect(headings).toContain("Tools");
    expect(detail!.gallery).toEqual([{ url: "http://img/a.png", alt: "Helper" }]);
  });

  it("returns null when the agent does not exist", async () => {
    mockAgent.mockResolvedValueOnce(null as never);
    expect(await resolveItemDetail("agents", "missing")).toBeNull();
  });
});

describe("resolveItemDetail — generic fallback + unknown block", () => {
  it("uses the DataProvider catalog for blocks without a dedicated resolver", async () => {
    genericProvider.getArtifactMeta.mockResolvedValueOnce([
      {
        id: "perk:k-1",
        type: "perk",
        name: "Free Shipping",
        description: "desc",
        status: "active",
        category: "logistics",
        imageUrl: "http://img/k.png",
        meta: { tier: "gold" },
      },
    ]);

    const detail = await resolveItemDetail("perks", "perk:k-1");
    expect(detail!.blockName).toBe("perks");
    expect(detail!.blockDisplayName).toBe("Perks");
    expect(detail!.name).toBe("Free Shipping");
    // meta fields are surfaced as primaryFacts
    expect(detail!.primaryFacts).toContainEqual({ label: "tier", value: "gold" });
  });

  it("returns null for a block that is not in the registry", async () => {
    expect(await resolveItemDetail("nonexistent-block", "x")).toBeNull();
  });

  it("returns null for a registered block with no artifact types", async () => {
    expect(await resolveItemDetail("empty", "x")).toBeNull();
  });
});
