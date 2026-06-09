import { describe, it, expect, vi, beforeEach } from "vitest";

// L1a.3 — activation. Asserts: Product is in TENANT_SCOPED_MODELS; import-url is
// sequential (no interactive $transaction); the provider/resolver loud-fail when
// read without a tenant context. Uses the REAL withTenant/requireTenantId (only
// prisma + route deps are mocked) so the AsyncLocalStorage context is exercised.
// Isolation (RLS) is NOT tested here — that is L1a.4.

vi.mock("@/lib/tenant/get-org-from-request", () => ({
  getOrgIdFromRequest: vi.fn(async () => "org-1"),
}));
vi.mock("@/lib/permissions", () => ({
  requireOrgRole: vi.fn(async () => ({ user: { id: "p1", activeOrgId: "org-1" } })),
}));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    $transaction: vi.fn(),
    product: {
      findUnique: vi.fn(async () => null),
      findMany: vi.fn(async () => []),
      create: vi.fn(async () => ({ id: "new" })),
    },
    productImage: { createMany: vi.fn(async () => ({ count: 0 })) },
  },
}));

vi.mock("@/lib/api-utils", async (importActual) => {
  const actual = await importActual<typeof import("@/lib/api-utils")>();
  return {
    ...actual,
    parseAndValidate: vi.fn(async () => ({
      data: {
        sku: "SKU-1",
        name: "Test",
        category: "SUPPLEMENT",
        retailPrice: 10,
        costOfGoods: 3,
        images: [{ url: "https://x/y.png", alt: null, isPrimary: true }],
      },
    })),
  };
});

const { prisma } = await import("@/lib/prisma");

describe("L1a.3 — activation: Product in TENANT_SCOPED_MODELS", () => {
  it("declares Product as tenant-scoped", async () => {
    const { TENANT_SCOPED_MODELS } = await import("@/lib/tenancy/prisma-extension");
    expect(TENANT_SCOPED_MODELS).toContain("Product");
  });
});

describe("L1a.3 — import-url is sequential (no interactive $transaction)", () => {
  beforeEach(() => vi.clearAllMocks());

  it("creates product + images via sequential ops, not prisma.$transaction", async () => {
    const { POST } = await import("../products/import-url/route");
    const res = await POST(
      new Request("http://app.localhost/api/products/import-url", {
        method: "POST",
        body: JSON.stringify({}),
      })
    );
    expect(res.status).toBe(201);
    expect(prisma.product.create).toHaveBeenCalledTimes(1);
    expect(prisma.productImage.createMany).toHaveBeenCalledTimes(1);
    // The whole point of L1a.3: no interactive transaction (would nest with the
    // tenancy Extension once Product is tenant-scoped).
    expect(prisma.$transaction).not.toHaveBeenCalled();
    // create carries tenant_id.
    const arg = vi.mocked(prisma.product.create).mock.calls[0][0] as {
      data: { tenantId?: string };
    };
    expect(arg.data.tenantId).toBe("org-1");
  });
});

describe("L1a.3 — loud-fail when Product is read without tenant context", () => {
  beforeEach(() => vi.clearAllMocks());

  it("ProductProvider.getCatalogItems throws outside withTenant", async () => {
    const { ProductProvider } = await import("@/lib/chat/providers/product.provider");
    const provider = new ProductProvider();
    await expect(provider.getCatalogItems()).rejects.toThrow(/withTenant/);
    expect(prisma.product.findMany).not.toHaveBeenCalled();
  });

  it("ProductProvider.getCatalogItems succeeds inside withTenant", async () => {
    const { ProductProvider } = await import("@/lib/chat/providers/product.provider");
    const { withTenant } = await import("@/lib/tenancy/context");
    const provider = new ProductProvider();
    const items = await withTenant("org-1", () => provider.getCatalogItems());
    expect(items).toEqual([]);
    expect(prisma.product.findMany).toHaveBeenCalled();
  });

  it("resolveItemDetail('products', id) throws outside withTenant", async () => {
    const { resolveItemDetail } = await import(
      "@/lib/marketplace/item-detail-resolver"
    );
    await expect(resolveItemDetail("products", "some-id")).rejects.toThrow(
      /withTenant/
    );
  });
});
