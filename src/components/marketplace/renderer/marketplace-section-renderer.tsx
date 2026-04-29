import Link from "next/link";
import Image from "next/image";
import { Tag } from "lucide-react";
import type { ComponentNode } from "@/types/landing-page";
import type { RenderContext, RenderItem } from "@/lib/marketplace/render-resolver";
import { MARKETPLACE_TYPES } from "@/lib/marketplace/component-registry";
import { InfiniteItemsGrid } from "./infinite-items-grid";

interface Props {
  components: ComponentNode[];
  ctx: RenderContext;
  blockNames: string[];
  /** Slug of the parent section, used to build internal links. */
  sectionSlug: string;
  /** Section id, used for the load-more API endpoint. */
  sectionId: string;
  /** "admin" — links into /admin admin shell; "public" — into /explore. */
  context: "admin" | "public";
}

export function MarketplaceSectionRenderer({
  components,
  ctx,
  blockNames,
  sectionSlug,
  sectionId,
  context,
}: Props) {
  // If the curator left the canvas empty, fall back to a default item grid
  // pulling from the first available block.
  if (components.length === 0) {
    const fallbackBlock = blockNames[0];
    const items = fallbackBlock ? ctx.itemsByBlock[fallbackBlock] ?? [] : [];
    const hasMore = fallbackBlock
      ? Boolean(ctx.hasMoreByBlock[fallbackBlock])
      : false;
    const total = fallbackBlock ? ctx.totalByBlock[fallbackBlock] ?? items.length : 0;
    const facets = fallbackBlock ? ctx.facetsByBlock[fallbackBlock] ?? [] : [];
    return (
      <div className="space-y-10 pt-2 pb-10">
        {fallbackBlock ? (
          <InfiniteItemsGrid
            sectionId={sectionId}
            blockName={fallbackBlock}
            initialItems={items}
            initialHasMore={hasMore}
            initialTotal={total}
            facets={facets}
            columns={4}
            title="All"
            context={context}
            sectionSlug={sectionSlug}
          />
        ) : (
          <p className="text-sm text-muted-foreground italic">
            No items in this section yet.
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-10 pt-2 pb-10">
      {components.map((c) => (
        <ComponentSwitch
          key={c.id}
          component={c}
          ctx={ctx}
          sectionSlug={sectionSlug}
          sectionId={sectionId}
          context={context}
        />
      ))}
    </div>
  );
}

function ComponentSwitch({
  component,
  ctx,
  sectionSlug,
  sectionId,
  context,
}: {
  component: ComponentNode;
  ctx: RenderContext;
  sectionSlug: string;
  sectionId: string;
  context: "admin" | "public";
}) {
  const props = (component.props ?? {}) as Record<string, unknown>;
  switch (component.type) {
    case MARKETPLACE_TYPES.BANNER:
      return <BannerRender props={props} sectionSlug={sectionSlug} />;
    case MARKETPLACE_TYPES.CATEGORIAS:
      return <CategoriasRender props={props} ctx={ctx} sectionSlug={sectionSlug} />;
    case MARKETPLACE_TYPES.COLECAO:
      return (
        <ColecaoRender
          props={props}
          ctx={ctx}
          sectionId={sectionId}
          sectionSlug={sectionSlug}
          context={context}
        />
      );
    case MARKETPLACE_TYPES.ITENS_GRID:
      return (
        <ItensGridRender
          props={props}
          ctx={ctx}
          sectionId={sectionId}
          sectionSlug={sectionSlug}
          context={context}
        />
      );
    default:
      return null;
  }
}

function BannerRender({
  props,
  sectionSlug,
}: {
  props: Record<string, unknown>;
  sectionSlug: string;
}) {
  const imageUrl = (props.imageUrl as string) || "";
  const title = (props.title as string) || "";
  const subtitle = (props.subtitle as string) || "";
  const linkType = (props.linkType as string) || "none";
  const linkBlockName = (props.linkBlockName as string) || "";
  const linkValue = (props.linkValue as string) || "";

  let href: string | null = null;
  if (linkType !== "none" && linkBlockName) {
    if (linkType === "category") {
      href = `/explore/${sectionSlug}?block=${encodeURIComponent(
        linkBlockName
      )}&category=${encodeURIComponent(linkValue)}`;
    } else if (linkType === "sub_category") {
      href = `/explore/${sectionSlug}?block=${encodeURIComponent(
        linkBlockName
      )}&subCategory=${encodeURIComponent(linkValue)}`;
    } else if (linkType === "item") {
      href = `/explore/${sectionSlug}/${encodeURIComponent(linkBlockName)}/${encodeURIComponent(linkValue)}`;
    }
  }

  const inner = (
    <div className="relative w-full aspect-[16/5] rounded-2xl overflow-hidden bg-zinc-900">
      {imageUrl && (
        <Image
          src={imageUrl}
          alt={title || "Banner"}
          fill
          className="object-cover"
          sizes="100vw"
        />
      )}
      {(title || subtitle) && (
        <div className="absolute inset-x-0 bottom-0 p-6 bg-gradient-to-t from-black/70 to-transparent text-white">
          {title && <h2 className="text-2xl font-bold">{title}</h2>}
          {subtitle && <p className="opacity-90">{subtitle}</p>}
        </div>
      )}
    </div>
  );

  return href ? (
    <Link href={href} className="block hover:opacity-95 transition-opacity">
      {inner}
    </Link>
  ) : (
    inner
  );
}

function CategoriasRender({
  props,
  ctx,
  sectionSlug,
}: {
  props: Record<string, unknown>;
  ctx: RenderContext;
  sectionSlug: string;
}) {
  const title = (props.title as string) || "Categories";
  const blockName = (props.blockName as string) || "";
  const kind = ((props.kind as string) || "category") as "category" | "sub_category";
  const values =
    kind === "category"
      ? ctx.categoriesByBlock[blockName] ?? []
      : ctx.subCategoriesByBlock[blockName] ?? [];
  if (values.length === 0) return null;

  return (
    <section>
      <h2 className="text-lg font-semibold mb-4">{title}</h2>
      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
        {values.map((v) => (
          <Link
            key={v}
            href={`/explore/${sectionSlug}?block=${encodeURIComponent(
              blockName
            )}&${kind === "category" ? "category" : "subCategory"}=${encodeURIComponent(v)}`}
            className="group rounded-lg border bg-card hover:bg-accent transition-colors aspect-square flex flex-col items-center justify-center gap-1.5 p-3 text-center"
          >
            <Tag className="h-4 w-4 text-muted-foreground group-hover:text-foreground" />
            <span className="text-xs font-medium truncate w-full">{v}</span>
          </Link>
        ))}
      </div>
    </section>
  );
}

function ColecaoRender({
  props,
  ctx,
  sectionId,
  sectionSlug,
  context,
}: {
  props: Record<string, unknown>;
  ctx: RenderContext;
  sectionId: string;
  sectionSlug: string;
  context: "admin" | "public";
}) {
  const title = (props.title as string) || "Featured";
  const subtitle = (props.subtitle as string) || "";
  const blockName = (props.blockName as string) || "";
  const itemIds = Array.isArray(props.itemIds) ? (props.itemIds as string[]) : [];
  const blockItems = ctx.itemsByBlock[blockName] ?? [];
  const items = itemIds
    .map((id) => blockItems.find((i) => i.id.endsWith(`:${id}`) || i.id === id))
    .filter(Boolean) as RenderItem[];

  if (items.length === 0) return null;

  const detailHref = (item: RenderItem) => {
    const colon = item.id.indexOf(":");
    const rawId = colon === -1 ? item.id : item.id.slice(colon + 1);
    return context === "admin"
      ? `/admin/marketplace/sections/${sectionId}/items/${blockName}/${rawId}`
      : `/explore/${sectionSlug}/${blockName}/${rawId}`;
  };

  return (
    <section>
      <div className="mb-4">
        <h2 className="text-lg font-semibold">{title}</h2>
        {subtitle && <p className="text-sm text-muted-foreground">{subtitle}</p>}
      </div>
      <div className="flex gap-4 overflow-x-auto pb-2 -mx-1 px-1">
        {items.map((item) => (
          <Link
            key={item.id}
            href={detailHref(item)}
            className="block group w-48 shrink-0"
          >
            <ItemCard item={item} className="w-full" />
          </Link>
        ))}
      </div>
    </section>
  );
}

function ItensGridRender({
  props,
  ctx,
  sectionId,
  sectionSlug,
  context,
}: {
  props: Record<string, unknown>;
  ctx: RenderContext;
  sectionId: string;
  sectionSlug: string;
  context: "admin" | "public";
}) {
  const title = (props.title as string) || "All";
  const blockName = (props.blockName as string) || "";
  const cols = Math.min(6, Math.max(1, Number(props.columns) || 4));
  const items = ctx.itemsByBlock[blockName] ?? [];
  const hasMore = Boolean(ctx.hasMoreByBlock[blockName]);
  const total = ctx.totalByBlock[blockName] ?? items.length;
  const facets = ctx.facetsByBlock[blockName] ?? [];
  if (items.length === 0) return null;

  return (
    <InfiniteItemsGrid
      sectionId={sectionId}
      blockName={blockName}
      initialItems={items}
      initialHasMore={hasMore}
      initialTotal={total}
      facets={facets}
      columns={cols}
      title={title}
      context={context}
      sectionSlug={sectionSlug}
    />
  );
}

function ItemCard({ item, className = "" }: { item: RenderItem; className?: string }) {
  return (
    <div className={`rounded-lg border bg-card overflow-hidden flex flex-col ${className}`}>
      <div className="aspect-square bg-muted relative">
        {item.imageUrl ? (
          <Image
            src={item.imageUrl}
            alt={item.name}
            fill
            sizes="(max-width: 768px) 50vw, 25vw"
            className="object-cover"
          />
        ) : null}
      </div>
      <div className="p-3 flex-1 flex flex-col gap-1">
        <p className="text-sm font-medium line-clamp-2 leading-tight">{item.name}</p>
        {item.description && (
          <p className="text-xs text-muted-foreground line-clamp-2">{item.description}</p>
        )}
      </div>
    </div>
  );
}
