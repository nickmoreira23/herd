"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { Search, X, SlidersHorizontal, Check } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import type { RenderItem } from "@/lib/marketplace/render-resolver";

interface Facet {
  key: string;
  label: string;
  options: Array<{ value: string; label: string; count: number }>;
}

interface Props {
  sectionId: string;
  blockName: string;
  initialItems: RenderItem[];
  initialHasMore: boolean;
  initialTotal: number;
  facets: Facet[];
  columns: number;
  title: string;
  /** "admin" or "public" — controls where item cards link to. */
  context: "admin" | "public";
  /** Section slug, used to build public detail links. */
  sectionSlug: string;
}

const PAGE_SIZE = 24;

export function InfiniteItemsGrid({
  sectionId,
  blockName,
  initialItems,
  initialHasMore,
  initialTotal,
  facets,
  columns,
  title,
  context,
  sectionSlug,
}: Props) {
  const detailHrefFor = (item: RenderItem) => {
    // RenderItem.id is "type:uuid" — strip the type prefix.
    const colon = item.id.indexOf(":");
    const rawId = colon === -1 ? item.id : item.id.slice(colon + 1);
    return context === "admin"
      ? `/admin/marketplace/sections/${sectionId}/items/${blockName}/${rawId}`
      : `/explore/${sectionSlug}/${blockName}/${rawId}`;
  };
  const [items, setItems] = useState<RenderItem[]>(initialItems);
  const [hasMore, setHasMore] = useState(initialHasMore);
  const [total, setTotal] = useState(initialTotal);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const loadingRef = useRef(false);

  // L2a.2b-4b — seed the category/subCategory filter from the URL (the category
  // chips link to ?block=<block>&category=<slug>). Only this block's grid reacts
  // (block param must match). Values are SLUGS; applyFilters slug-matches them.
  const searchParams = useSearchParams();
  const urlFilters = useMemo<Record<string, string[]>>(() => {
    if (searchParams.get("block") !== blockName) return {};
    const f: Record<string, string[]> = {};
    const cat = searchParams.get("category");
    const sub = searchParams.get("subCategory");
    if (cat) f.category = [cat];
    if (sub) f.subCategory = [sub];
    return f;
  }, [searchParams, blockName]);

  // Search + filter state. Empty query/filters fall back to initial server payload.
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [filters, setFilters] = useState<Record<string, string[]>>(urlFilters);

  // Reset when navigating between sections / when the URL filter changes.
  useEffect(() => {
    setItems(initialItems);
    setHasMore(initialHasMore);
    setTotal(initialTotal);
    setQuery("");
    setDebouncedQuery("");
    setFilters(urlFilters);
    setError(null);
  }, [sectionId, blockName, initialItems, initialHasMore, initialTotal, urlFilters]);

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => setDebouncedQuery(query), 250);
    return () => clearTimeout(t);
  }, [query]);

  const filterKey = useMemo(
    () => JSON.stringify({ q: debouncedQuery, f: filters }),
    [debouncedQuery, filters]
  );
  const hasFilterOrQuery =
    debouncedQuery.trim().length > 0 ||
    Object.values(filters).some((v) => v.length > 0);

  // When the search/filter changes, refetch from offset 0.
  useEffect(() => {
    // Skip the very first run when filters are empty: the server already
    // gave us the right page-0 data.
    if (!hasFilterOrQuery && items === initialItems) return;

    let cancelled = false;
    setLoading(true);
    setError(null);
    fetchPage(0)
      .then((res) => {
        if (cancelled || !res) return;
        setItems(res.items);
        setHasMore(res.hasMore);
        setTotal(res.total);
      })
      .catch(() => !cancelled && setError("Failed to load items"))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterKey]);

  // Infinite-scroll sentinel
  useEffect(() => {
    if (!hasMore) return;
    const node = sentinelRef.current;
    if (!node) return;

    const observer = new IntersectionObserver(
      async (entries) => {
        const entry = entries[0];
        if (!entry?.isIntersecting || loadingRef.current || !hasMore) return;
        loadingRef.current = true;
        setLoading(true);
        const res = await fetchPage(items.length);
        if (res) {
          setItems((prev) => {
            const seen = new Set(prev.map((p) => p.id));
            return [...prev, ...res.items.filter((n) => !seen.has(n.id))];
          });
          setHasMore(res.hasMore);
          setTotal(res.total);
        }
        loadingRef.current = false;
        setLoading(false);
      },
      { rootMargin: "400px 0px" }
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [sectionId, blockName, items.length, hasMore]);

  async function fetchPage(offset: number) {
    try {
      const params = new URLSearchParams({
        block: blockName,
        offset: String(offset),
        limit: String(PAGE_SIZE),
      });
      if (debouncedQuery.trim()) params.set("q", debouncedQuery.trim());
      if (Object.values(filters).some((v) => v.length > 0)) {
        params.set("filters", JSON.stringify(filters));
      }
      const res = await fetch(
        `/api/marketplace/sections/${sectionId}/items?${params.toString()}`
      );
      const j = await res.json();
      if (!res.ok) {
        setError(j.error ?? "Failed to load items");
        return null;
      }
      return j.data as { items: RenderItem[]; hasMore: boolean; total: number };
    } catch (e) {
      console.error(e);
      setError("Network error");
      return null;
    }
  }

  function toggleFilter(key: string, value: string) {
    setFilters((prev) => {
      const cur = prev[key] ?? [];
      const next = cur.includes(value)
        ? cur.filter((v) => v !== value)
        : [...cur, value];
      const out = { ...prev, [key]: next };
      if (next.length === 0) delete out[key];
      return out;
    });
  }

  function clearAllFilters() {
    setFilters({});
    setQuery("");
  }

  const activeFilterCount = Object.values(filters).reduce(
    (acc, v) => acc + v.length,
    0
  );

  return (
    <section>
      {/* Header row: title + search + filters */}
      <div className="flex items-center justify-between gap-3 mb-4 flex-wrap">
        <h2 className="text-lg font-semibold">{title}</h2>
        <div className="flex items-center gap-2 flex-1 sm:flex-none sm:min-w-[420px] justify-end">
          <div className="relative flex-1 max-w-md">
            <Search className="h-3.5 w-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search…"
              className="pl-8 pr-20 h-9"
            />
            <Badge
              variant="secondary"
              className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] tabular-nums"
            >
              {total} {total === 1 ? "item" : "items"}
            </Badge>
          </div>
          {facets.length > 0 && (
            <FilterPopover
              facets={facets}
              filters={filters}
              onToggle={toggleFilter}
              activeCount={activeFilterCount}
            />
          )}
          {(activeFilterCount > 0 || query) && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearAllFilters}
              className="h-9 text-xs"
            >
              <X className="h-3.5 w-3.5 mr-1" /> Clear
            </Button>
          )}
        </div>
      </div>

      {/* Active filter chips */}
      {activeFilterCount > 0 && (
        <div className="flex items-center gap-1.5 flex-wrap mb-3">
          {Object.entries(filters).flatMap(([key, values]) =>
            values.map((value) => {
              const facet = facets.find((f) => f.key === key);
              // Display the option's label (slug filters carry a label).
              const optLabel =
                facet?.options.find((o) => o.value === value)?.label ?? value;
              return (
                <Badge
                  key={`${key}:${value}`}
                  variant="outline"
                  className="text-[10px] gap-1 pr-1"
                >
                  <span className="text-muted-foreground">
                    {facet?.label ?? key}:
                  </span>
                  {optLabel}
                  <button
                    onClick={() => toggleFilter(key, value)}
                    className="ml-0.5 rounded hover:bg-accent p-0.5"
                    aria-label="Remove filter"
                  >
                    <X className="h-2.5 w-2.5" />
                  </button>
                </Badge>
              );
            })
          )}
        </div>
      )}

      {/* Items grid */}
      {items.length === 0 && !loading ? (
        <p className="text-sm text-muted-foreground italic py-8 text-center">
          No items match.
        </p>
      ) : (
        <div
          className="grid gap-4"
          style={{ gridTemplateColumns: `repeat(${columns}, minmax(0,1fr))` }}
        >
          {items.map((item) => (
            <Link
              key={item.id}
              href={detailHrefFor(item)}
              className="block group"
            >
              <ItemCard item={item} />
            </Link>
          ))}
          {loading &&
            Array.from({ length: columns }).map((_, i) => (
              <div
                key={`skel-${i}`}
                className="rounded-lg border bg-card overflow-hidden animate-pulse"
              >
                <div className="aspect-square bg-muted" />
                <div className="p-3 space-y-1.5">
                  <div className="h-3 bg-muted rounded w-3/4" />
                  <div className="h-2 bg-muted rounded w-1/2" />
                </div>
              </div>
            ))}
        </div>
      )}

      {error && (
        <p className="mt-4 text-xs text-destructive text-center">{error}</p>
      )}
      {hasMore && <div ref={sentinelRef} className="h-1 w-full" aria-hidden />}
      {!hasMore && items.length > PAGE_SIZE && (
        <p className="mt-6 text-[11px] text-muted-foreground text-center">
          End of list
        </p>
      )}
    </section>
  );
}

// ─── Filter popover ─────────────────────────────────────────────

function FilterPopover({
  facets,
  filters,
  onToggle,
  activeCount,
}: {
  facets: Facet[];
  filters: Record<string, string[]>;
  onToggle: (key: string, value: string) => void;
  activeCount: number;
}) {
  return (
    <Popover>
      <PopoverTrigger
        className={cn(
          "inline-flex items-center gap-1.5 h-9 px-3 rounded-md border text-xs font-medium hover:bg-accent transition-colors",
          activeCount > 0 ? "border-primary text-primary" : "border-input"
        )}
      >
        <SlidersHorizontal className="h-3.5 w-3.5" />
        Filters
        {activeCount > 0 && (
          <Badge className="h-4 px-1.5 text-[10px]">{activeCount}</Badge>
        )}
      </PopoverTrigger>
      <PopoverContent align="end" className="w-72 p-0">
        <div className="max-h-96 overflow-y-auto">
          {facets.map((facet) => {
            const selected = filters[facet.key] ?? [];
            return (
              <div key={facet.key} className="border-b last:border-b-0">
                <p className="text-[11px] uppercase tracking-wider text-muted-foreground/80 px-3 pt-3 pb-1">
                  {facet.label}
                </p>
                <div className="pb-2">
                  {facet.options.map((opt) => {
                    const checked = selected.includes(opt.value);
                    return (
                      <button
                        key={opt.value}
                        onClick={() => onToggle(facet.key, opt.value)}
                        className="flex items-center gap-2 w-full px-3 py-1.5 text-xs hover:bg-accent text-left"
                      >
                        <div
                          className={cn(
                            "h-3.5 w-3.5 rounded border flex items-center justify-center",
                            checked
                              ? "bg-primary border-primary text-primary-foreground"
                              : "border-input"
                          )}
                        >
                          {checked && <Check className="h-2.5 w-2.5" />}
                        </div>
                        <span className="flex-1 truncate">{opt.label}</span>
                        <span className="text-[10px] text-muted-foreground tabular-nums">
                          {opt.count}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </PopoverContent>
    </Popover>
  );
}

// ─── Card ───────────────────────────────────────────────────────

function ItemCard({ item }: { item: RenderItem }) {
  return (
    <div className="rounded-lg border bg-card overflow-hidden flex flex-col h-full transition-all group-hover:border-foreground/30 group-hover:shadow-sm">
      <div className="aspect-square bg-muted relative overflow-hidden">
        {item.imageUrl ? (
          <Image
            src={item.imageUrl}
            alt={item.name}
            fill
            sizes="(max-width: 768px) 50vw, 25vw"
            className="object-cover transition-transform group-hover:scale-105"
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
