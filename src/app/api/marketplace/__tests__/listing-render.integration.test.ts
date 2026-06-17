import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { withTenant } from "@/lib/tenancy/context";
import { buildRenderContext } from "@/lib/marketplace/render-resolver";

/**
 * L2b.2 — the /explore render combines AUTOMATIC scopes + curated LISTINGS.
 * Proves: (a) scope + listing combine without duplicating; (b) a listing's
 * override (title) shows; (c) the listing WINS over the same item from an auto
 * scope; (e) a dangling listing (block record gone) is skipped from the grid.
 * Runs against a real RLS-enabled DB (buildRenderContext uses the herd_app
 * singleton under withTenant). Excluded from `npm test`.
 */
const adminUrl = process.env.DATABASE_URL;
if (!adminUrl) throw new Error("DATABASE_URL required");
const admin = new PrismaClient({ adapter: new PrismaPg(adminUrl) });

const PREFIX = `test-l2b2-render-${Date.now()}`;
const VIEWER = { isSuperAdmin: true, roles: [] as never[] };
let org: { id: string };
let sectionId: string;
let productA: string;
let productB: string;

function product(sku: string, name: string) {
  return {
    tenantId: org.id,
    sku: `${PREFIX}-${sku}`,
    name,
    category: "SUPPLEMENT",
    retailPrice: "49.90",
    memberPrice: "39.90",
    costOfGoods: "15.00",
    isActive: true,
  };
}

beforeAll(async () => {
  org = await admin.organization.create({
    data: { slug: PREFIX, subdomain: PREFIX, name: "L2b2 Render" },
    select: { id: true },
  });
  const a = await admin.product.create({ data: product("a", "Raw A"), select: { id: true } });
  const b = await admin.product.create({ data: product("b", "Raw B"), select: { id: true } });
  productA = a.id;
  productB = b.id;

  const section = await admin.marketplaceSection.create({
    data: { tenantId: org.id, slug: `${PREFIX}-sec`, name: "Sec", status: "PUBLISHED" },
    select: { id: true },
  });
  sectionId = section.id;

  // Automatic scope: CATEGORY "supplement" (slug of "SUPPLEMENT") → covers A + B.
  await admin.marketplaceSectionScope.create({
    data: { tenantId: org.id, sectionId, blockName: "products", scopeType: "CATEGORY", scopeValue: "supplement" },
  });
  // Curated listing over product A with a title override + featured.
  await admin.listing.create({
    data: { tenantId: org.id, sectionId, blockName: "products", sourceId: productA, titleOverride: "Curated A", featured: true },
  });
  // Dangling listing — references a product that doesn't exist.
  await admin.listing.create({
    data: { tenantId: org.id, sectionId, blockName: "products", sourceId: "00000000-0000-0000-0000-000000000000" },
  });
});

afterAll(async () => {
  await admin.organization.delete({ where: { id: org.id } }); // cascades section/scope/listing/product
  await admin.$disconnect();
});

describe("L2b.2 — render combines scopes + listings (integration)", () => {
  async function render() {
    const section = await admin.marketplaceSection.findUniqueOrThrow({
      where: { id: sectionId },
      include: { scopes: true },
    });
    return withTenant(org.id, () => buildRenderContext(section as never, VIEWER));
  }

  it("combines auto-scope items + curated listing without duplicating; listing wins; override shows; dangling skipped", async () => {
    const ctx = await render();
    const items = ctx.itemsByBlock.products ?? [];

    // A (curated) + B (auto scope) — no duplicate of A, dangling listing absent.
    expect(items).toHaveLength(2);

    const byRawId = new Map(
      items.map((i) => [i.id.includes(":") ? i.id.slice(i.id.indexOf(":") + 1) : i.id, i]),
    );
    // (b)+(c) product A appears as the LISTING (override title wins over "Raw A").
    expect(byRawId.get(productA)?.name).toBe("Curated A");
    expect(byRawId.get(productA)?.featured).toBe(true);
    // B comes from the auto scope, unchanged.
    expect(byRawId.get(productB)?.name).toBe("Raw B");
    // featured curated item sorts first.
    expect(items[0].name).toBe("Curated A");
  });
});
