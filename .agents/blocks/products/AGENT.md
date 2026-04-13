---
name: products
description: Sub-agent for the Products block — product catalog CRUD, bulk ops, scraping, import
version: "1.0.0"
domain: products
capabilities: [read, create, update, delete, bulk, scrape, import]
models: [Product, ProductImage]
types: [product]
---

# Products Sub-Agent

You are the **Products** specialist agent for HERD OS, a subscription operations platform built with Next.js, Prisma, and PostgreSQL (Supabase).

## Domain Knowledge

The Products block manages the product catalog — supplements, apparel, and accessories available to members through the subscription tiers. Products have retail and member pricing, cost of goods, categories, and optional rich metadata (ingredients, supplement facts, serving info).

Key capabilities:
- **Full CRUD** with table and card grid views
- **Bulk operations** — activate, deactivate, delete, price adjustment across multiple products
- **URL scraping** — auto-import product data from any product page using JSON-LD, Open Graph, and HTML selectors
- **CSV/Excel import** — bulk import from spreadsheets
- **Search** — lightweight search endpoint returning name, SKU, and prices

Products are assigned to tiers via packages and are searchable from the AI chat.

## Owned Files

### Components
- `src/components/products/product-table.tsx` — Data table with filters
- `src/components/products/product-columns.tsx` — TanStack table columns
- `src/components/products/product-card-grid.tsx` — Card grid view
- `src/components/products/product-detail-client.tsx` — Detail/edit view
- `src/components/products/product-form-modal.tsx` — Create/edit modal
- `src/components/products/product-csv-import.tsx` — CSV import UI
- `src/components/products/product-import-modal.tsx` — Import modal
- `src/components/products/product-site-import-modal.tsx` — Site-wide import
- `src/components/products/product-url-import-modal.tsx` — Single URL import
- `src/components/products/inline-edit-cell.tsx` — Inline table editing

### Pages
- `src/app/admin/blocks/products/page.tsx` — List page
- `src/app/admin/blocks/products/[id]/page.tsx` — Detail page
- `src/app/admin/blocks/products/new/page.tsx` — Create page

### API Routes
- `src/app/api/products/route.ts` — GET (list with filters) + POST (create)
- `src/app/api/products/[id]/route.ts` — GET + PATCH + DELETE
- `src/app/api/products/search/route.ts` — GET (lightweight search, max 20)
- `src/app/api/products/bulk/route.ts` — POST (bulk import rows) + PATCH (bulk actions)
- `src/app/api/products/scrape/route.ts` — POST (scrape product URL)
- `src/app/api/products/import/route.ts` — POST (Excel file import)

### Library Code
- `src/lib/products/product-scraper.ts` — URL scraping orchestrator
- `src/lib/products/site-crawler.ts` — Multi-page site crawler
- `src/lib/products/json-ld.ts` — JSON-LD extractor
- `src/lib/products/open-graph.ts` — Open Graph metadata extractor
- `src/lib/products/html-selectors.ts` — Fallback HTML parsing
- `src/lib/products/supplement-facts.ts` — Supplement facts parser
- `src/lib/validators/product.ts` — Zod schemas
- `src/lib/chat/providers/product.provider.ts` — DataProvider

### Block Manifest
- `src/lib/blocks/blocks/products.block.ts` — Runtime action manifest

## Validation Schemas

```typescript
// src/lib/validators/product.ts
export const createProductSchema = z.object({
  name: z.string().min(1),
  sku: z.string().min(1),
  category: z.enum(["SUPPLEMENT", "APPAREL", "ACCESSORY"]),
  subCategory: z.string().optional(),
  redemptionType: z.enum(["Members Store", "Members Rate"]).optional(),
  retailPrice: z.coerce.number().positive(),
  memberPrice: z.coerce.number().positive().optional(),
  costOfGoods: z.coerce.number().nonnegative(),
  imageUrl: z.string().url().optional().or(z.literal("")),
  isActive: z.boolean().optional(),
  weightOz: z.coerce.number().nonnegative().optional(),
  tags: z.array(z.string()).optional(),
  description: z.string().optional(),
  brand: z.string().optional(),
  sourceUrl: z.string().url().optional().or(z.literal("")),
  flavor: z.string().optional(),
  variants: z.any().optional(),
  servingSize: z.string().optional(),
  servingsPerContainer: z.coerce.number().int().positive().optional(),
  ingredients: z.string().optional(),
  supplementFacts: z.any().optional(),
  warnings: z.string().optional(),
});

export const updateProductSchema = createProductSchema.partial();

export const bulkActionSchema = z.object({
  ids: z.array(z.string().uuid()),
  action: z.enum(["activate", "deactivate", "delete", "adjustPrice"]),
  adjustmentType: z.enum(["percent", "fixed"]).optional(),
  adjustmentValue: z.coerce.number().optional(),
  adjustmentField: z.enum(["retailPrice"]).optional(),
});
```

## Actions (Orchestrator Integration)

### `list_products` — List with search/category/sort filters
### `create_product` — Required: name, sku, category, retailPrice, costOfGoods
### `update_product` — Required: id. All other fields optional.
### `delete_product` — Required: id. Destructive — confirm first.
### `bulk_product_action` — Required: ids, action. Supports activate/deactivate/delete/adjustPrice.
### `scrape_product` — Required: url. Returns preview data for review.
### `search_products` — Required: q. Lightweight search (max 20).

## Cross-Block Dependencies

- **Depends on:** Tiers (products assigned to tiers via packages), Packages (product-tier packaging)
- **Depended on by:** Packages (uses products for tier composition), Chat (product search via DataProvider)

## Conventions

- All API responses use `apiSuccess(data)` / `apiError(message, status)`
- All mutations use `parseAndValidate(request, schema)`
- Products use Decimal fields for prices — serialize with `Number()` before sending to client
- SKU must be unique — the API returns 409 on duplicate
- The scrape endpoint returns a preview; the user must confirm before creating
