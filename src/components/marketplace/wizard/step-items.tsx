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

type ProfileTypeOption = { id: string; displayName: string };
type RoleOption = { id: string; displayName: string };

interface ScopeItem {
  id: string;
  name: string;
  imageUrl: string | null;
  category: string | null;
  subCategory: string | null;
}

interface ScopeOptions {
  categories: string[];
  subCategories: string[];
  items: ScopeItem[];
}

interface Props {
  eligibleBlocks: EligibleBlock[];
  profileTypes: ProfileTypeOption[];
  roles: RoleOption[];
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
  profileTypes,
  roles,
  onNext,
  onBack,
}: Props) {
  const { selectedBlockNames, scopes } = useMarketplaceWizardStore();

  // At least one scope per block is required to proceed.
  const blockNamesWithScope = new Set(scopes.map((s) => s.blockName));
  const allBlocksHaveScope = selectedBlockNames.every((b) =>
    blockNamesWithScope.has(b)
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
            <BlockScopesPanel
              key={blockName}
              block={block}
              profileTypes={profileTypes}
              roles={roles}
            />
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

function BlockScopesPanel({
  block,
  profileTypes,
  roles,
}: {
  block: EligibleBlock;
  profileTypes: ProfileTypeOption[];
  roles: RoleOption[];
}) {
  const { scopes, addScope, updateScope, removeScope, cacheItemSnapshot } =
    useMarketplaceWizardStore();
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
  const Icon = BLOCK_ICON_MAP[block.name] ?? DefaultBlockIcon;
  const label = BLOCK_LABEL_MAP[block.name] ?? block.displayName;

  function add(scopeType: ScopeType, scopeValue: string | null) {
    // Avoid duplicates.
    if (
      blockScopes.some(
        (s) => s.scopeType === scopeType && s.scopeValue === scopeValue
      )
    ) {
      toast.info("That scope is already added.");
      return;
    }
    // Cache item snapshot if this is an ITEM scope.
    if (scopeType === "ITEM" && scopeValue && options) {
      const item = options.items.find((i) => i.id === scopeValue);
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
    }
    addScope({
      clientId: genId(),
      blockName: block.name,
      scopeType,
      scopeValue,
      sortOrder: blockScopes.length,
      allowedProfileTypeIds: [],
      allowedRoleIds: [],
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
            {blockScopes.length} scope{blockScopes.length === 1 ? "" : "s"}
          </p>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* Existing scopes */}
        {blockScopes.length === 0 && (
          <p className="text-xs text-muted-foreground italic">
            No scopes added yet. Add at least one to continue.
          </p>
        )}
        <div className="space-y-2">
          {blockScopes.map((s) => (
            <ScopeRow
              key={s.clientId}
              scope={s}
              profileTypes={profileTypes}
              roles={roles}
              onUpdate={(patch) => updateScope(s.clientId, patch)}
              onRemove={() => removeScope(s.clientId)}
            />
          ))}
        </div>

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
  profileTypes,
  roles,
  onUpdate,
  onRemove,
}: {
  scope: SectionScopeDraft;
  profileTypes: ProfileTypeOption[];
  roles: RoleOption[];
  onUpdate: (patch: Partial<SectionScopeDraft>) => void;
  onRemove: () => void;
}) {
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const Icon = SCOPE_ICONS[scope.scopeType];
  const restricted =
    scope.allowedProfileTypeIds.length > 0 || scope.allowedRoleIds.length > 0;
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
              label="Allowed profile types"
              options={profileTypes.map((p) => ({ id: p.id, label: p.displayName }))}
              selected={scope.allowedProfileTypeIds}
              onChange={(ids) => onUpdate({ allowedProfileTypeIds: ids })}
            />
            <CheckboxList
              label="Allowed roles"
              options={roles.map((r) => ({ id: r.id, label: r.displayName }))}
              selected={scope.allowedRoleIds}
              onChange={(ids) => onUpdate({ allowedRoleIds: ids })}
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
  values: string[];
  onAdd: (value: string) => void;
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
            <SelectItem key={v} value={v}>
              {v}
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
