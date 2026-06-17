"use client";

import { useEffect, useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ArrowLeft,
  ArrowRight,
  Plus,
  X,
  Tag,
  FolderTree,
  Package as PackageIcon,
  Globe,
  Search,
  ChevronDown,
  ChevronRight,
  Lock,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import {
  useMarketplaceWizardStore,
  type SectionScopeDraft,
  type ScopeType,
} from "@/stores/marketplace-section-wizard-store";
import type { EligibleBlock } from "@/lib/marketplace/types";
import { BLOCK_ICON_MAP, BLOCK_LABEL_MAP } from "@/lib/blocks/block-meta";
import { Layers as DefaultBlockIcon } from "lucide-react";
import { SECTION_SCOPE_ROLES } from "@/lib/validators/marketplace";
import type { MemberRole } from "@prisma/client";

interface ScopeItem {
  id: string;
  name: string;
  imageUrl: string | null;
  category: string | null;
  subCategory: string | null;
}

// L2a.2b — categories/subCategories now carry the stable slug `key` + display
// `label` (from the block manifest taxonomy). The wizard stores `key` as
// scopeValue; the label is shown to the user.
interface TaxonomyOption {
  key: string;
  label: string;
}

interface ScopeOptions {
  categories: TaxonomyOption[];
  subCategories: Array<TaxonomyOption & { categoryKey: string }>;
  items: ScopeItem[];
}

interface Props {
  eligibleBlocks: EligibleBlock[];
  onNext: () => void;
  onBack: () => void;
}

const SCOPE_LABELS: Record<ScopeType, string> = {
  ALL: "All items",
  CATEGORY: "Category",
  SUB_CATEGORY: "Sub-category",
  ITEM: "Specific item",
};

const SCOPE_ICONS: Record<ScopeType, React.ElementType> = {
  ALL: Globe,
  CATEGORY: Tag,
  SUB_CATEGORY: FolderTree,
  ITEM: PackageIcon,
};

function genId() {
  return `cs_${Math.random().toString(36).slice(2, 10)}`;
}

export function StepItems({
  eligibleBlocks,
  onNext,
  onBack,
}: Props) {
  const { selectedBlockNames, scopes, listings } = useMarketplaceWizardStore();

  // L2b.2 — a block is satisfied by at least one automatic scope OR one curated
  // listing (a "specific item" is now a Listing, no longer an ITEM scope).
  const blockNamesWithEntry = new Set([
    ...scopes.map((s) => s.blockName),
    ...listings.map((l) => l.blockName),
  ]);
  const allBlocksHaveScope = selectedBlockNames.every((b) =>
    blockNamesWithEntry.has(b)
  );

  return (
    <div className="rounded-xl border border-border bg-card">
      <div className="p-6 space-y-6">
        <div>
          <h2 className="text-lg font-semibold">Pick what to show</h2>
          <p className="text-sm text-muted-foreground mt-1">
            For each block, choose &ldquo;all items&rdquo;, a category, a sub-category, or a
            specific item. By default a scope is visible to every profile in the org — toggle the
            advanced lock to restrict it.
          </p>
        </div>

        {selectedBlockNames.map((blockName) => {
          const block = eligibleBlocks.find((b) => b.name === blockName);
          if (!block) return null;
          return (
            <BlockScopesPanel key={blockName} block={block} />
          );
        })}
      </div>

      <div className="flex items-center justify-between border-t px-6 py-4 bg-muted/30 rounded-b-xl">
        <Button variant="ghost" onClick={onBack}>
          <ArrowLeft className="h-4 w-4 mr-2" /> Back
        </Button>
        <Button onClick={onNext} disabled={!allBlocksHaveScope}>
          <ArrowRight className="h-4 w-4 mr-2" /> Next: Section
        </Button>
      </div>
    </div>
  );
}

// ─── Per-block panel ─────────────────────────────────────

function BlockScopesPanel({ block }: { block: EligibleBlock }) {
  const {
    scopes,
    listings,
    itemSnapshots,
    addScope,
    updateScope,
    removeScope,
    addListing,
    removeListing,
    cacheItemSnapshot,
  } = useMarketplaceWizardStore();
  const [options, setOptions] = useState<ScopeOptions | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetch(`/api/marketplace/blocks/${block.name}/scope-options`)
      .then((r) => r.json())
      .then((j) => {
        if (cancelled) return;
        const data = j.data as ScopeOptions | undefined;
        setOptions(
          data ?? { categories: [], subCategories: [], items: [] }
        );
      })
      .catch(() => {
        if (!cancelled) toast.error(`Failed to load options for ${block.displayName}`);
      })
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [block.name, block.displayName]);

  const blockScopes = scopes.filter((s) => s.blockName === block.name);
  const blockListings = listings.filter((l) => l.blockName === block.name);
  const Icon = BLOCK_ICON_MAP[block.name] ?? DefaultBlockIcon;
  const label = BLOCK_LABEL_MAP[block.name] ?? block.displayName;

  function add(scopeType: ScopeType, scopeValue: string | null) {
    // L2b.2 — "specific item" creates a curated Listing, not an ITEM scope.
    if (scopeType === "ITEM") {
      if (!scopeValue) return;
      if (blockListings.some((l) => l.sourceId === scopeValue)) {
        toast.info("That item is already added.");
        return;
      }
      const item = options?.items.find((i) => i.id === scopeValue);
      if (item) {
        cacheItemSnapshot({
          fullId: `${block.primaryType}:${item.id}`,
          rawId: item.id,
          blockName: block.name,
          type: block.primaryType,
          name: item.name,
          imageUrl: item.imageUrl,
          category: item.category,
          subCategory: item.subCategory,
        });
      }
      addListing({ clientId: genId(), blockName: block.name, sourceId: scopeValue });
      return;
    }
    // Automatic scopes (ALL/CATEGORY/SUB_CATEGORY) — avoid duplicates.
    if (
      blockScopes.some(
        (s) => s.scopeType === scopeType && s.scopeValue === scopeValue
      )
    ) {
      toast.info("That scope is already added.");
      return;
    }
    addScope({
      clientId: genId(),
      blockName: block.name,
      scopeType,
      scopeValue,
      sortOrder: blockScopes.length,
      allowedRoles: [],
    });
  }

  return (
    <Card className="p-0 overflow-hidden">
      <div className="flex items-center gap-3 px-4 py-3 border-b bg-muted/20">
        <div className="h-9 w-9 rounded-lg bg-card flex items-center justify-center">
          <Icon className="h-4 w-4" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-medium text-sm">{label}</p>
          <p className="text-xs text-muted-foreground">
            {blockScopes.length} rule{blockScopes.length === 1 ? "" : "s"}
            {blockListings.length > 0 &&
              ` · ${blockListings.length} curated item${blockListings.length === 1 ? "" : "s"}`}
          </p>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* Existing automatic scopes */}
        {blockScopes.length === 0 && blockListings.length === 0 && (
          <p className="text-xs text-muted-foreground italic">
            Nothing added yet. Add a rule or a specific item to continue.
          </p>
        )}
        <div className="space-y-2">
          {blockScopes.map((s) => (
            <ScopeRow
              key={s.clientId}
              scope={s}
              onUpdate={(patch) => updateScope(s.clientId, patch)}
              onRemove={() => removeScope(s.clientId)}
            />
          ))}
        </div>

        {/* L2b.2 — curated items (Listings) */}
        {blockListings.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-[11px] uppercase tracking-wider text-muted-foreground">
              Curated items
            </p>
            {blockListings.map((l) => {
              const snap = Object.values(itemSnapshots).find(
                (s) => s.rawId === l.sourceId && s.blockName === l.blockName
              );
              return (
                <div
                  key={l.clientId}
                  className="flex items-center gap-2 rounded-md border bg-background px-3 py-2 text-sm"
                >
                  <PackageIcon className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                  <span className="flex-1 min-w-0 truncate">{snap?.name ?? l.sourceId}</span>
                  <Button variant="ghost" size="icon" onClick={() => removeListing(l.clientId)}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              );
            })}
          </div>
        )}

        {/* Adder */}
        {loading ? (
          <p className="text-xs text-muted-foreground">Loading options…</p>
        ) : (
          <ScopeAdder options={options} onAdd={add} />
        )}
      </div>
    </Card>
  );
}

// ─── Scope row (existing scope display + visibility editor) ─────

function ScopeRow({
  scope,
  onUpdate,
  onRemove,
}: {
  scope: SectionScopeDraft;
  onUpdate: (patch: Partial<SectionScopeDraft>) => void;
  onRemove: () => void;
}) {
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const Icon = SCOPE_ICONS[scope.scopeType];
  const restricted = scope.allowedRoles.length > 0;
  const { itemSnapshots } = useMarketplaceWizardStore();
  const itemSnap =
    scope.scopeType === "ITEM" && scope.scopeValue
      ? Object.values(itemSnapshots).find(
          (s) => s.rawId === scope.scopeValue && s.blockName === scope.blockName
        )
      : null;

  return (
    <div className="rounded-lg border bg-background">
      <div className="flex items-center gap-3 p-3">
        <Icon className="h-4 w-4 text-muted-foreground shrink-0" />
        <div className="flex-1 min-w-0 text-sm">
          <span className="text-muted-foreground">{SCOPE_LABELS[scope.scopeType]}: </span>
          <span className="font-medium">
            {scope.scopeType === "ALL"
              ? "Every item in this block"
              : itemSnap?.name ?? scope.scopeValue}
          </span>
        </div>
        {restricted && (
          <Badge variant="secondary" className="text-[10px]">
            <Lock className="h-3 w-3 mr-1" /> restricted
          </Badge>
        )}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setAdvancedOpen(!advancedOpen)}
        >
          {advancedOpen ? (
            <ChevronDown className="h-4 w-4" />
          ) : (
            <ChevronRight className="h-4 w-4" />
          )}
          Advanced
        </Button>
        <Button variant="ghost" size="icon" onClick={onRemove}>
          <X className="h-4 w-4" />
        </Button>
      </div>
      {advancedOpen && (
        <div className="border-t px-3 py-3 space-y-3 bg-muted/10">
          <p className="text-xs text-muted-foreground">
            Empty selection means this scope is visible to every authenticated viewer.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <CheckboxList
              label="Allowed roles"
              options={SECTION_SCOPE_ROLES.map((r) => ({ id: r, label: r }))}
              selected={scope.allowedRoles}
              onChange={(ids) => onUpdate({ allowedRoles: ids as MemberRole[] })}
            />
          </div>
        </div>
      )}
    </div>
  );
}

function CheckboxList({
  label,
  options,
  selected,
  onChange,
}: {
  label: string;
  options: { id: string; label: string }[];
  selected: string[];
  onChange: (next: string[]) => void;
}) {
  function toggle(id: string) {
    onChange(selected.includes(id) ? selected.filter((s) => s !== id) : [...selected, id]);
  }
  return (
    <div>
      <Label className="text-xs uppercase tracking-wider text-muted-foreground">
        {label}
      </Label>
      <div className="mt-1.5 max-h-40 overflow-y-auto rounded-md border bg-background p-2 space-y-1">
        {options.length === 0 && (
          <p className="text-xs text-muted-foreground p-1">None available</p>
        )}
        {options.map((o) => (
          <label
            key={o.id}
            className="flex items-center gap-2 text-sm cursor-pointer hover:bg-accent rounded px-1.5 py-1"
          >
            <input
              type="checkbox"
              checked={selected.includes(o.id)}
              onChange={() => toggle(o.id)}
            />
            <span className="truncate">{o.label}</span>
          </label>
        ))}
      </div>
    </div>
  );
}

// ─── Adder (tabbed: ALL / Category / Sub-category / Item) ──────

function ScopeAdder({
  options,
  onAdd,
}: {
  options: ScopeOptions | null;
  onAdd: (type: ScopeType, value: string | null) => void;
}) {
  const [tab, setTab] = useState<ScopeType>("ALL");
  const [search, setSearch] = useState("");

  const itemMatches = useMemo(() => {
    if (!options) return [];
    if (!search.trim()) return options.items.slice(0, 50);
    const q = search.toLowerCase();
    return options.items.filter((i) => i.name.toLowerCase().includes(q)).slice(0, 50);
  }, [options, search]);

  const tabs: ScopeType[] = ["ALL", "CATEGORY", "SUB_CATEGORY", "ITEM"];

  return (
    <div className="rounded-md border p-3 bg-background space-y-3">
      <div className="flex items-center gap-1 flex-wrap">
        {tabs.map((t) => {
          const Icon = SCOPE_ICONS[t];
          const active = tab === t;
          return (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={cn(
                "px-3 py-1.5 text-xs font-medium rounded-md flex items-center gap-1.5 transition-colors",
                active
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-accent"
              )}
            >
              <Icon className="h-3 w-3" />
              {SCOPE_LABELS[t]}
            </button>
          );
        })}
      </div>

      {tab === "ALL" && (
        <Button size="sm" onClick={() => onAdd("ALL", null)}>
          <Plus className="h-3 w-3 mr-1" /> Add &ldquo;All items&rdquo; scope
        </Button>
      )}

      {tab === "CATEGORY" && (
        <CategoryAdder
          values={options?.categories ?? []}
          onAdd={(v) => onAdd("CATEGORY", v)}
        />
      )}

      {tab === "SUB_CATEGORY" && (
        <CategoryAdder
          values={options?.subCategories ?? []}
          onAdd={(v) => onAdd("SUB_CATEGORY", v)}
          emptyMessage="This block has no sub-categories yet."
        />
      )}
      {/* CategoryAdder stores the stable `key` (slug) as scopeValue (L2a.2b). */}

      {tab === "ITEM" && (
        <div className="space-y-2">
          <div className="relative">
            <Search className="h-3.5 w-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search items…"
              className="pl-8"
            />
          </div>
          <div className="max-h-56 overflow-y-auto rounded-md border bg-background">
            {itemMatches.length === 0 && (
              <p className="p-3 text-xs text-muted-foreground italic">No items match.</p>
            )}
            {itemMatches.map((it) => (
              <button
                key={it.id}
                onClick={() => onAdd("ITEM", it.id)}
                className="flex items-center gap-3 w-full px-3 py-2 text-left text-sm hover:bg-accent"
              >
                {it.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={it.imageUrl}
                    alt=""
                    className="h-7 w-7 rounded object-cover bg-muted"
                  />
                ) : (
                  <div className="h-7 w-7 rounded bg-muted" />
                )}
                <div className="flex-1 min-w-0">
                  <p className="truncate">{it.name}</p>
                  {(it.category || it.subCategory) && (
                    <p className="text-[11px] text-muted-foreground truncate">
                      {it.category}
                      {it.subCategory ? ` · ${it.subCategory}` : ""}
                    </p>
                  )}
                </div>
                <Plus className="h-3.5 w-3.5 text-muted-foreground" />
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function CategoryAdder({
  values,
  onAdd,
  emptyMessage,
}: {
  values: TaxonomyOption[];
  onAdd: (key: string) => void;
  emptyMessage?: string;
}) {
  const [picked, setPicked] = useState<string>("");

  if (values.length === 0) {
    return (
      <p className="text-xs text-muted-foreground italic">
        {emptyMessage ?? "This block has no categories yet."}
      </p>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <Select value={picked} onValueChange={setPicked}>
        <SelectTrigger className="flex-1">
          <SelectValue placeholder="Pick a value…" />
        </SelectTrigger>
        <SelectContent>
          {values.map((v) => (
            <SelectItem key={v.key} value={v.key}>
              {v.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Button
        size="sm"
        disabled={!picked}
        onClick={() => {
          if (!picked) return;
          onAdd(picked);
          setPicked("");
        }}
      >
        <Plus className="h-3 w-3 mr-1" /> Add
      </Button>
    </div>
  );
}
