import { describe, it, expect, vi, beforeEach } from "vitest";
import type { ArtifactMeta } from "@/lib/chat/types";

// L2b.1 — resolveListing tests. Mock the registry + providers so the GENERIC
// resolution path (blockRegistry → provider → getArtifactMeta) is exercised
// without a DB. A non-"products" block proves the path is generic, not a switch.
vi.mock("@/lib/blocks/registry", () => ({
  blockRegistry: new Map([
    ["documents", { name: "documents", displayName: "Documents", types: ["document"] }],
    ["products", { name: "products", displayName: "Products", types: ["product"] }],
  ]),
}));

let metaById: Record<string, ArtifactMeta | undefined> = {};
const getArtifactMeta = vi.fn(async (ids: string[]) =>
  ids.map((id) => metaById[id]).filter(Boolean),
);
vi.mock("@/lib/chat/data-retrieval", () => ({
  providers: [
    { domain: "knowledge", types: ["document"], getArtifactMeta },
    { domain: "foundation", types: ["product"], getArtifactMeta },
  ],
}));

import { resolveListing } from "../listing-resolver";

function listing(partial: Record<string, unknown> = {}) {
  return {
    id: "l1",
    tenantId: "org-1",
    blockName: "documents",
    sourceId: "src-1",
    titleOverride: null,
    descriptionOverride: null,
    imageUrlOverride: null,
    priceOverrideCents: null,
    priceOverrideCurrency: null,
    featured: false,
    sortOrder: 0,
    status: "DRAFT",
    createdAt: new Date(),
    updatedAt: new Date(),
    ...partial,
  } as never;
}

beforeEach(() => {
  vi.clearAllMocks();
  metaById = {
    "src-1": {
      id: "document:src-1",
      type: "document",
      name: "Block Title",
      description: "Block description",
      imageUrl: "https://block/img.png",
      status: "active",
      category: "guide",
      meta: {},
    },
    "prod-1": {
      id: "product:prod-1",
      type: "product",
      name: "Whey",
      description: null,
      imageUrl: null,
      status: "active",
      category: "SUPPLEMENT",
      meta: { retailPrice: 29.99 },
    },
  };
});

describe("resolveListing — generic resolution + overrides", () => {
  it("resolves a NON-products block via getArtifactMeta (proves generic path)", async () => {
    const r = await resolveListing(listing());
    expect(getArtifactMeta).toHaveBeenCalledWith(["src-1"]);
    expect(r.available).toBe(true);
    expect(r.title).toBe("Block Title"); // inherited
    expect(r.blockName).toBe("documents");
  });

  it("override wins; absent override inherits from the block", async () => {
    const r = await resolveListing(
      listing({ titleOverride: "My Title", descriptionOverride: null, imageUrlOverride: "https://o/x.png" }),
    );
    expect(r.title).toBe("My Title"); // override
    expect(r.description).toBe("Block description"); // inherited (override null)
    expect(r.imageUrl).toBe("https://o/x.png"); // override
  });

  it("dangling sourceId → available:false, does NOT throw", async () => {
    const r = await resolveListing(listing({ sourceId: "gone", titleOverride: "Kept" }));
    expect(r.available).toBe(false);
    expect(r.title).toBe("Kept"); // surviving override still surfaced
  });
});

describe("resolveListing — price (Money cents)", () => {
  it("price override (cents) wins and is flagged as override", async () => {
    const r = await resolveListing(
      listing({ blockName: "products", sourceId: "prod-1", priceOverrideCents: 1500n, priceOverrideCurrency: "USD" }),
    );
    expect(r.price?.amountCents).toBe(1500n);
    expect(r.price?.currency).toBe("USD");
    expect(r.priceIsOverride).toBe(true);
  });

  it("no override → derives the block price (Decimal dollars → cents)", async () => {
    const r = await resolveListing(listing({ blockName: "products", sourceId: "prod-1" }));
    expect(r.price?.amountCents).toBe(2999n); // 29.99 → 2999 cents
    expect(r.priceIsOverride).toBe(false);
  });

  it("block without a price → price null", async () => {
    const r = await resolveListing(listing()); // documents, meta.meta = {}
    expect(r.price).toBeNull();
  });
});
