"use client";

import { useMemo } from "react";
import { Image as ImageIcon, Tag, LayoutList, Grid3x3 } from "lucide-react";
import type { ComponentNode } from "@/types/landing-page";
import { useMarketplaceWizardStore } from "@/stores/marketplace-section-wizard-store";

/**
 * Editor-time preview of a marketplace component. Shows what the user
 * will see roughly. Doesn't fetch data — uses cached snapshots from the
 * wizard store when available.
 */
export function ComponentPreview({ component }: { component: ComponentNode }) {
  const itemSnapshots = useMarketplaceWizardStore((s) => s.itemSnapshots);
  const props = component.props as Record<string, unknown>;

  switch (component.type) {
    case "mkt.banner":
      return <BannerPreview props={props} />;
    case "mkt.categorias":
      return <CategoriasPreview props={props} />;
    case "mkt.colecao": {
      const blockName = (props.blockName as string) || "";
      const itemIds = Array.isArray(props.itemIds) ? (props.itemIds as string[]) : [];
      return (
        <ColecaoPreview
          props={props}
          items={itemIds
            .map((id) =>
              Object.values(itemSnapshots).find(
                (s) => s.rawId === id && s.blockName === blockName
              )
            )
            .filter(Boolean) as Array<{ rawId: string; name: string; imageUrl: string | null }>}
        />
      );
    }
    case "mkt.itens-grid":
      return <ItensGridPreview props={props} />;
    default:
      return <p className="text-xs text-muted-foreground">Unknown component</p>;
  }
}

function BannerPreview({ props }: { props: Record<string, unknown> }) {
  const imageUrl = props.imageUrl as string | undefined;
  const title = props.title as string | undefined;
  const subtitle = props.subtitle as string | undefined;
  return (
    <div
      className="relative w-full aspect-[16/5] rounded-lg overflow-hidden bg-zinc-900 flex items-end p-6"
      style={{
        backgroundImage: imageUrl ? `url(${imageUrl})` : undefined,
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      {!imageUrl && (
        <div className="absolute inset-0 flex items-center justify-center text-zinc-500">
          <ImageIcon className="h-8 w-8" />
        </div>
      )}
      {(title || subtitle) && (
        <div className="relative z-10 text-white">
          {title && <h3 className="text-xl font-bold">{title}</h3>}
          {subtitle && <p className="text-sm opacity-90">{subtitle}</p>}
        </div>
      )}
    </div>
  );
}

function CategoriasPreview({ props }: { props: Record<string, unknown> }) {
  const title = (props.title as string) || "Categories";
  const block = (props.blockName as string) || "—";
  return (
    <div className="space-y-2">
      <p className="text-sm font-semibold">{title}</p>
      <div className="grid grid-cols-4 gap-2">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="aspect-square rounded-md border bg-muted flex flex-col items-center justify-center gap-1 text-xs text-muted-foreground"
          >
            <Tag className="h-3.5 w-3.5" />
            <span>cat {i}</span>
          </div>
        ))}
      </div>
      <p className="text-[10px] text-muted-foreground italic">
        Pulled from block: {block || "(pick one)"}
      </p>
    </div>
  );
}

function ColecaoPreview({
  props,
  items,
}: {
  props: Record<string, unknown>;
  items: Array<{ rawId: string; name: string; imageUrl: string | null }>;
}) {
  const title = (props.title as string) || "Featured";
  const subtitle = props.subtitle as string | undefined;
  return (
    <div className="space-y-2">
      <div>
        <p className="text-sm font-semibold">{title}</p>
        {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
      </div>
      <div className="flex gap-2 overflow-x-auto pb-1">
        {items.length === 0 && (
          <div className="flex-1 rounded-md border bg-muted/30 p-4 text-center text-xs text-muted-foreground">
            <LayoutList className="h-4 w-4 mx-auto mb-1" />
            No items added yet.
          </div>
        )}
        {items.map((item) => (
          <div
            key={item.rawId}
            className="w-28 shrink-0 rounded-md border bg-card overflow-hidden"
          >
            <div className="aspect-square bg-muted">
              {item.imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={item.imageUrl} alt="" className="w-full h-full object-cover" />
              ) : null}
            </div>
            <p className="px-1.5 py-1 text-[10px] truncate">{item.name}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function ItensGridPreview({ props }: { props: Record<string, unknown> }) {
  const title = (props.title as string) || "All";
  const cols = useMemo(() => {
    const n = Number(props.columns);
    return Number.isFinite(n) && n >= 1 && n <= 6 ? n : 4;
  }, [props.columns]);
  return (
    <div className="space-y-2">
      <p className="text-sm font-semibold">{title}</p>
      <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${cols}, minmax(0,1fr))` }}>
        {Array.from({ length: cols * 2 }).map((_, i) => (
          <div key={i} className="rounded-md border bg-muted/40 aspect-square flex items-center justify-center">
            <Grid3x3 className="h-4 w-4 text-muted-foreground" />
          </div>
        ))}
      </div>
    </div>
  );
}
