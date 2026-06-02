import { describe, it, expect, vi } from "vitest";
import type { ReactElement } from "react";

// Mock the client grid so (a) we don't pull its hooks/deps and (b) we can
// detect it by reference in the rendered element tree.
vi.mock("../infinite-items-grid", () => ({
  InfiniteItemsGrid: function InfiniteItemsGrid() {
    return null;
  },
}));

import { MarketplaceSectionRenderer } from "../marketplace-section-renderer";
import { InfiniteItemsGrid } from "../infinite-items-grid";
import { MARKETPLACE_TYPES } from "@/lib/marketplace/component-registry";
import type { ComponentNode } from "@/types/landing-page";
import type { RenderContext } from "@/lib/marketplace/render-resolver";

function emptyCtx(): RenderContext {
  return {
    itemsByBlock: { products: [{ id: "product:a", name: "A" }] as never },
    hasMoreByBlock: { products: false },
    totalByBlock: { products: 1 },
    categoriesByBlock: { products: ["supplements"] },
    subCategoriesByBlock: { products: [] },
    facetsByBlock: { products: [] },
  };
}

/** Recursively flatten a React element tree into a list of nodes. */
function flatten(node: unknown, acc: unknown[] = []): unknown[] {
  if (node === null || node === undefined || typeof node !== "object") return acc;
  if (Array.isArray(node)) {
    for (const n of node) flatten(n, acc);
    return acc;
  }
  acc.push(node);
  const el = node as ReactElement<{ children?: unknown }>;
  if (el.props && el.props.children !== undefined) flatten(el.props.children, acc);
  return acc;
}

function baseProps(components: ComponentNode[], blockNames: string[]) {
  return {
    components,
    ctx: emptyCtx(),
    blockNames,
    sectionSlug: "deals",
    sectionId: "sec-1",
    context: "public" as const,
  };
}

describe("MarketplaceSectionRenderer — empty-canvas fallback", () => {
  it("falls back to an items grid pulling from the first block", () => {
    const out = MarketplaceSectionRenderer(baseProps([], ["products"])) as ReactElement;
    const nodes = flatten(out);
    expect(nodes.some((n) => (n as ReactElement).type === InfiniteItemsGrid)).toBe(true);
  });

  it("renders a graceful 'no items' message when there are no blocks", () => {
    const out = MarketplaceSectionRenderer(baseProps([], [])) as ReactElement;
    const nodes = flatten(out) as ReactElement[];
    expect(nodes.some((n) => n.type === "p")).toBe(true);
    expect(nodes.some((n) => n.type === InfiniteItemsGrid)).toBe(false);
  });
});

describe("MarketplaceSectionRenderer — component switch dispatch", () => {
  function node(type: string, props: Record<string, unknown> = {}): ComponentNode {
    return { id: `c-${type}`, type, props } as ComponentNode;
  }

  /** Render the section, then invoke each ComponentSwitch child one level. */
  function dispatchedNames(components: ComponentNode[]): (string | null)[] {
    const out = MarketplaceSectionRenderer(baseProps(components, ["products"])) as ReactElement;
    const children = (out.props as { children: ReactElement[] }).children;
    return children.map((child) => {
      const fn = child.type as (p: unknown) => ReactElement | null;
      const rendered = fn(child.props);
      return rendered ? ((rendered.type as { name?: string }).name ?? "anonymous") : null;
    });
  }

  it("dispatches each known component type to its renderer", () => {
    const names = dispatchedNames([
      node(MARKETPLACE_TYPES.BANNER, { imageUrl: "x" }),
      node(MARKETPLACE_TYPES.CATEGORIAS, { blockName: "products" }),
      node(MARKETPLACE_TYPES.COLECAO, { blockName: "products" }),
      node(MARKETPLACE_TYPES.ITENS_GRID, { blockName: "products" }),
    ]);
    expect(names).toEqual([
      "BannerRender",
      "CategoriasRender",
      "ColecaoRender",
      "ItensGridRender",
    ]);
  });

  it("degrades gracefully (renders nothing) for an unknown component type", () => {
    expect(dispatchedNames([node("mkt.unknown-widget")])).toEqual([null]);
  });

  it("emits one switch per component node", () => {
    const out = MarketplaceSectionRenderer(
      baseProps([node(MARKETPLACE_TYPES.BANNER), node(MARKETPLACE_TYPES.ITENS_GRID)], ["products"])
    ) as ReactElement;
    const children = (out.props as { children: ReactElement[] }).children;
    expect(children).toHaveLength(2);
  });
});
