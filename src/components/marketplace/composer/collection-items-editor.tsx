"use client";

import { useEffect, useState } from "react";
import { Search, Plus, X, GripVertical } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useMarketplaceWizardStore } from "@/stores/marketplace-section-wizard-store";

interface ScopeItem {
  id: string;
  name: string;
  imageUrl: string | null;
  category: string | null;
  subCategory: string | null;
}

interface Props {
  blockName: string;
  value: string[];
  onChange: (next: string[]) => void;
}

export function CollectionItemsEditor({ blockName, value, onChange }: Props) {
  const cacheItemSnapshot = useMarketplaceWizardStore((s) => s.cacheItemSnapshot);
  const itemSnapshots = useMarketplaceWizardStore((s) => s.itemSnapshots);
  const [items, setItems] = useState<ScopeItem[] | null>(null);
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (!blockName) {
      setItems(null);
      return;
    }
    let cancelled = false;
    fetch(`/api/marketplace/blocks/${blockName}/scope-options`)
      .then((r) => r.json())
      .then((j) => {
        if (cancelled) return;
        setItems((j.data?.items as ScopeItem[]) ?? []);
      })
      .catch(() => !cancelled && setItems([]));
    return () => {
      cancelled = true;
    };
  }, [blockName]);

  const matches = items
    ? items
        .filter((i) => !value.includes(i.id))
        .filter((i) =>
          search.trim() ? i.name.toLowerCase().includes(search.toLowerCase()) : true
        )
        .slice(0, 30)
    : [];

  function add(item: ScopeItem) {
    onChange([...value, item.id]);
    cacheItemSnapshot({
      fullId: `${blockName}:${item.id}`,
      rawId: item.id,
      blockName,
      type: blockName,
      name: item.name,
      imageUrl: item.imageUrl,
      category: item.category,
      subCategory: item.subCategory,
    });
  }

  function remove(id: string) {
    onChange(value.filter((v) => v !== id));
  }

  function move(idx: number, dir: -1 | 1) {
    const target = idx + dir;
    if (target < 0 || target >= value.length) return;
    const next = [...value];
    [next[idx], next[target]] = [next[target], next[idx]];
    onChange(next);
  }

  function lookupSnap(rawId: string) {
    return Object.values(itemSnapshots).find(
      (s) => s.rawId === rawId && s.blockName === blockName
    );
  }

  return (
    <div className="space-y-2">
      <Label className="text-xs">Items</Label>
      {!blockName && (
        <p className="text-[11px] text-muted-foreground italic">
          Pick a block first.
        </p>
      )}

      {/* Selected items */}
      {value.length > 0 && (
        <div className="space-y-1 rounded-md border bg-background p-1.5">
          {value.map((id, idx) => {
            const snap = lookupSnap(id);
            return (
              <div
                key={id}
                className="flex items-center gap-2 rounded px-1.5 py-1 text-xs hover:bg-muted/40"
              >
                <button
                  className="text-muted-foreground hover:text-foreground"
                  title="Move"
                >
                  <GripVertical className="h-3 w-3" />
                </button>
                {snap?.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={snap.imageUrl}
                    alt=""
                    className="h-6 w-6 rounded object-cover bg-muted"
                  />
                ) : (
                  <div className="h-6 w-6 rounded bg-muted" />
                )}
                <span className="flex-1 truncate">{snap?.name ?? id}</span>
                <Button variant="ghost" size="icon" onClick={() => move(idx, -1)} className="h-5 w-5">
                  ↑
                </Button>
                <Button variant="ghost" size="icon" onClick={() => move(idx, 1)} className="h-5 w-5">
                  ↓
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => remove(id)}
                  className="h-5 w-5"
                  title="Remove"
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            );
          })}
        </div>
      )}

      {/* Search + adder */}
      {blockName && (
        <>
          <div className="relative">
            <Search className="h-3 w-3 absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search items…"
              className="pl-7 h-7 text-xs"
            />
          </div>
          <div className="max-h-44 overflow-y-auto rounded-md border bg-background">
            {items === null && (
              <p className="p-2 text-[11px] text-muted-foreground italic">Loading…</p>
            )}
            {items !== null && matches.length === 0 && (
              <p className="p-2 text-[11px] text-muted-foreground italic">
                {value.length > 0 && !search ? "All items added." : "No items match."}
              </p>
            )}
            {matches.map((it) => (
              <button
                key={it.id}
                onClick={() => add(it)}
                className="flex w-full items-center gap-2 px-2 py-1.5 text-left text-xs hover:bg-accent"
              >
                {it.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={it.imageUrl}
                    alt=""
                    className="h-6 w-6 rounded object-cover bg-muted"
                  />
                ) : (
                  <div className="h-6 w-6 rounded bg-muted" />
                )}
                <span className="flex-1 truncate">{it.name}</span>
                <Plus className="h-3 w-3" />
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
