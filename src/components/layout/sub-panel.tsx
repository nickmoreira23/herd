"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import searchIndex from "../../../mcp/generated/search-index.json";
import { adminLocaleToHandbookLocale } from "@/lib/handbook/config";
import {
  PanelLeftClose,
  Settings2,
  LayoutGrid,
  type LucideIcon,
  // Icons for non-blocks sub-panels
  Users,
  Layers,
  Shield,
  Image,
  Palette,
  Type,
  RectangleHorizontal,
  Sparkles,
  MessageSquare,
  Building2,
  Phone,
  MapPin,
  Clock,
  Globe,
  FileText,
  ClipboardList,
  Table2,
  Link2,
  Rss,
  Plug,
  GitBranch,
  Share2,
  Video,
  Music,
  Bot,
  Receipt,
  CreditCard,
  BarChart3,
  Megaphone,
  Mail,
  LifeBuoy,
  Kanban,
  Box,
  Brain,
  TrendingUp,
  Wallet,
  Blocks,
  ShoppingBag,
  Dumbbell,
  CalendarDays,
  History,
  UtensilsCrossed,
  ChefHat,
  ListChecks,
  GraduationCap,
  BookMarked,
  Newspaper,
  PlayCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useUIStore } from "@/stores/ui-store";
import { useProfileView } from "@/lib/core/profile-view/hook";
import { BLOCK_ICON_MAP, BLOCK_LABEL_MAP } from "@/lib/blocks/block-meta";
import { getBlockLabel, getCategoryLabel } from "@/lib/blocks/block-labels";
import { useLocale, useT } from "@/lib/i18n/locale-context";
import type { MessageKey } from "@/lib/i18n/t";
import { getAllToolCategories } from "@/lib/tools/registry";
import { TOOL_ICON_MAP } from "@/lib/tools/category-meta";
import type { BlockCategory } from "@/lib/blocks/block-categories";
import {
  DEFAULT_BLOCK_CATEGORIES,
  DEFAULT_CATEGORY_COLOR,
  BLOCK_CATEGORIES_SETTING_KEY,
  parseBlockCategories,
  hexToRgba,
} from "@/lib/blocks/block-categories";
import { ManageBlocksDialog } from "@/components/blocks/manage-blocks-dialog";
import { ManageSectionsDialog } from "@/components/marketplace/admin/manage-sections-dialog";
import { ManageKnowledgeDialog } from "@/components/knowledge/manage-knowledge-dialog";
import {
  KNOWLEDGE_BLOCKS_SETTING_KEY,
  KNOWLEDGE_FALLBACK_CATEGORY_ID,
  KNOWLEDGE_FALLBACK_CATEGORY_LABEL,
  KNOWLEDGE_TYPE_BLOCKS,
  groupSelectedSources,
  parseKnowledgeBlocks,
} from "@/lib/knowledge-commons/constants";
import { getAllBlocks } from "@/lib/blocks/registry";
import {
  getCachedSections,
  setCachedSections,
  invalidateSectionsCache,
  type CachedSection,
} from "@/lib/marketplace/sections-cache";

// ─── Sub-panel config ────────────────────────────────────────────────

export interface SubPanelLink {
  href: string;
  label: string;
  /**
   * Optional i18n key. When present, takes precedence over `label`.
   * Type kept loose (`string`) to avoid coupling sub-panel registry to
   * the entire MessageKey union; the renderer casts at lookup time.
   */
  labelKey?: string;
  icon?: LucideIcon;
}

export interface SubPanelCategory {
  id: string;
  label: string;
  /** Optional translation key. When present, takes precedence over `label`. */
  labelKey?: string;
  links: SubPanelLink[];
}

export interface SubPanelConfig {
  id: string;
  label: string;
  /** Optional translation key. When present, takes precedence over `label`. */
  labelKey?: string;
  links: SubPanelLink[];
  categories?: SubPanelCategory[];
}

// Registry of all sub-panels — add new ones here
export const subPanelRegistry: Record<string, SubPanelConfig> = {
  agents: {
    id: "agents",
    label: "Agents",
    links: [
      { href: "/admin/agents/orchestrator", label: "Orchestrator", icon: MessageSquare },
      { href: "/admin/agents/specialists", label: "Specialists", icon: Sparkles },
      { href: "/admin/agents/blocks", label: "Block Agents", icon: Blocks },
    ],
  },
  blocks: {
    id: "blocks",
    label: "Blocks",
    links: [], // Dynamically rendered by BlocksSubPanel
  },
  organization: {
    id: "organization",
    label: "Organization",
    labelKey: "organization.subpanel.title",
    links: [],
    categories: [
      {
        id: "profile",
        label: "Profile",
        labelKey: "organization.subpanel.profile_category",
        links: [
          { href: "/admin/organization/profile", label: "General Information", labelKey: "organization.subpanel.general_information", icon: Building2 },
          { href: "/admin/organization/profile/contact", label: "Contact Information", labelKey: "organization.subpanel.contact_information", icon: Phone },
          { href: "/admin/organization/profile/locations", label: "Locations", labelKey: "organization.subpanel.locations", icon: MapPin },
          { href: "/admin/organization/profile/business-hours", label: "Business Hours", labelKey: "organization.subpanel.business_hours", icon: Clock },
          { href: "/admin/organization/profile/regional-settings", label: "Regional Settings", labelKey: "organization.subpanel.regional_settings", icon: Globe },
        ],
      },
      {
        id: "brand-kit",
        label: "Brand Kit",
        links: [
          { href: "/admin/organization/brand-kit/logos", label: "Logos", icon: Image },
          { href: "/admin/organization/brand-kit/colors", label: "Colors", icon: Palette },
          { href: "/admin/organization/brand-kit/fonts", label: "Fonts", icon: Type },
          { href: "/admin/organization/brand-kit/buttons", label: "Buttons", icon: RectangleHorizontal },
          { href: "/admin/organization/brand-kit/appearance", label: "Appearance", icon: Sparkles },
          { href: "/admin/organization/brand-kit/brand-voice", label: "Brand Voice", icon: MessageSquare },
        ],
      },
    ],
  },
  knowledge: {
    id: "knowledge",
    label: "Knowledge",
    links: [], // Dynamically rendered by KnowledgeSubPanel
  },
  integrations: {
    id: "integrations",
    label: "Integrations",
    links: [
      { href: "/admin/integrations", label: "All Integrations", icon: LayoutGrid },
      { href: "/admin/integrations/billing", label: "Billing", icon: Receipt },
      { href: "/admin/integrations/payment", label: "Payment", icon: CreditCard },
      { href: "/admin/integrations/crm", label: "CRM", icon: Users },
      { href: "/admin/integrations/analytics", label: "Analytics", icon: BarChart3 },
      { href: "/admin/integrations/marketing", label: "Marketing", icon: Megaphone },
      { href: "/admin/integrations/communication", label: "Communication", icon: Mail },
      { href: "/admin/integrations/support", label: "Support", icon: LifeBuoy },
      { href: "/admin/integrations/meetings", label: "Meetings", icon: Video },
      { href: "/admin/integrations/project-management", label: "Project Management", icon: Kanban },
      { href: "/admin/integrations/social-media", label: "Social Media", icon: Share2 },
      { href: "/admin/integrations/ai-models", label: "AI Models", icon: Brain },
      { href: "/admin/integrations/other", label: "Other", icon: Box },
    ],
  },
  tools: {
    id: "tools",
    label: "Tools",
    links: [], // Dynamically rendered by ToolsSubPanel
  },
  marketplace: {
    id: "marketplace",
    label: "Marketplace",
    links: [], // Dynamically rendered by MarketplaceSubPanel
  },
  ledger: {
    id: "ledger",
    label: "Ledger",
    labelKey: "nav.sidebar.ledger",
    links: [
      {
        href: "/admin/ledger",
        label: "Plano de Contas",
        labelKey: "ledger.subpanel.chart_of_accounts",
        icon: LayoutGrid,
      },
      {
        href: "/admin/ledger/entries",
        label: "Journal Entries",
        labelKey: "ledger.subpanel.journal_entries",
        icon: FileText,
      },
    ],
  },
  handbook: {
    id: "handbook",
    label: "Handbook",
    links: [], // Dynamically rendered by HandbookSubPanel
  },
  exercise: {
    id: "exercise",
    label: "Exercise",
    links: [
      { href: "/admin/spaces/exercise/workouts", label: "Workouts", icon: Dumbbell },
      { href: "/admin/spaces/exercise/schedule", label: "Schedule", icon: CalendarDays },
      { href: "/admin/spaces/exercise/history", label: "History", icon: History },
    ],
  },
  nutrition: {
    id: "nutrition",
    label: "Nutrition",
    links: [
      { href: "/admin/spaces/nutrition/meal-plan", label: "Meal Plan", icon: UtensilsCrossed },
      { href: "/admin/spaces/nutrition/recipes", label: "Recipes", icon: ChefHat },
      { href: "/admin/spaces/nutrition/food-log", label: "Food Log", icon: ListChecks },
    ],
  },
  learn: {
    id: "learn",
    label: "Learn",
    links: [
      { href: "/admin/learn/courses", label: "Courses", icon: GraduationCap },
      { href: "/admin/learn/guides", label: "Guides", icon: BookMarked },
      { href: "/admin/learn/articles", label: "Articles", icon: Newspaper },
      { href: "/admin/learn/videos", label: "Videos", icon: PlayCircle },
    ],
  },
};

// Map a sidebar href to a sub-panel ID (if it should open one)
export const hrefToSubPanel: Record<string, string> = {
  "/admin/agents": "agents",
  "/admin/blocks": "blocks",
  "/admin/tools": "tools",
  "/admin/organization/profile": "organization",
  "/admin/knowledge": "knowledge",
  "/admin/integrations": "integrations",
  "/admin/marketplace": "marketplace",
  "/admin/ledger": "ledger",
  "/admin/handbook": "handbook",
  "/admin/spaces/exercise": "exercise",
  "/admin/spaces/nutrition": "nutrition",
  "/admin/learn": "learn",
};

// All hrefs that belong to a sub-panel (used to auto-detect active panel from pathname)
export function getSubPanelIdForPath(pathname: string): string | null {
  if (pathname.startsWith("/admin/blocks")) return "blocks";
  if (pathname.startsWith("/admin/agents")) return "agents";
  if (pathname.startsWith("/admin/tools")) return "tools";
  if (pathname.startsWith("/admin/marketplace")) return "marketplace";
  if (pathname.startsWith("/admin/ledger")) return "ledger";
  if (pathname.startsWith("/admin/handbook")) return "handbook";
  if (pathname.startsWith("/admin/knowledge")) return "knowledge";
  if (pathname.startsWith("/admin/organization")) return "organization";
  if (pathname.startsWith("/admin/spaces/exercise")) return "exercise";
  if (pathname.startsWith("/admin/spaces/nutrition")) return "nutrition";
  if (pathname.startsWith("/admin/learn")) return "learn";

  for (const [, config] of Object.entries(subPanelRegistry)) {
    if (config.links.some((link) => pathname.startsWith(link.href))) {
      return config.id;
    }
  }
  return null;
}

// ─── Sub-panel width ─────────────────────────────────────────────────

export const SUB_PANEL_WIDTH = 240; // px

// ─── Blocks Sub-Panel (dynamic categories) ───────────────────────────

function BlocksSubPanel() {
  const pathname = usePathname();
  const { setSubPanelCollapsed } = useUIStore();
  const locale = useLocale();
  const t = useT();
  const [categories, setCategories] = useState<BlockCategory[]>(DEFAULT_BLOCK_CATEGORIES);
  const [dialogOpen, setDialogOpen] = useState(false);

  useEffect(() => {
    fetch("/api/settings")
      .then((res) => res.json())
      .then((json) => {
        if (json.data?.[BLOCK_CATEGORIES_SETTING_KEY]) {
          const parsed = parseBlockCategories(json.data[BLOCK_CATEGORIES_SETTING_KEY]);
          setCategories(parsed);
        }
      })
      .catch(() => {});
  }, []);

  const isActive = (href: string) => {
    if (href === "/admin/blocks") return pathname === "/admin/blocks";
    return pathname.startsWith(href);
  };

  return (
    <div
      className="shrink-0 flex flex-col border-r border-border bg-card h-screen transition-all duration-200 ease-in-out"
      style={{ width: SUB_PANEL_WIDTH }}
    >
      {/* Header */}
      <div className="flex items-center justify-between pt-6 pb-4">
        <h2 className="text-[16px] font-semibold truncate pl-6">Blocks</h2>
        <button
          onClick={() => setSubPanelCollapsed(true)}
          className="text-muted-foreground hover:text-foreground transition-colors p-1.5 rounded-md hover:bg-accent mr-4"
          title={t("nav.subpanel.collapse")}
        >
          <PanelLeftClose className="h-4 w-4" />
        </button>
      </div>

      {/* Links */}
      <nav className="flex-1 pb-4 overflow-y-auto overscroll-contain px-3">
        {/* All Blocks link */}
        <Link
          href="/admin/blocks"
          className={cn(
            "flex items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium transition-colors",
            pathname === "/admin/blocks"
              ? "bg-primary/10 text-primary dark:bg-brand/10 dark:text-brand"
              : "text-muted-foreground hover:bg-accent hover:text-foreground"
          )}
        >
          <LayoutGrid className="h-4 w-4 shrink-0" />
          <span className="truncate">All Blocks</span>
        </Link>

        {/* Category sections */}
        {categories.map((cat) => {
          const catColor = cat.color || DEFAULT_CATEGORY_COLOR;
          return (
            <div key={cat.id} className="mt-4">
              <p className="px-3 pb-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/70">
                {getCategoryLabel(cat.id, locale)}
              </p>
              <div className="space-y-2">
                {cat.blocks.map((blockName) => {
                  const Icon = BLOCK_ICON_MAP[blockName];
                  const label = getBlockLabel(blockName, locale);
                  const href = `/admin/blocks/${blockName}`;
                  const active = isActive(href);
                  return (
                    <Link
                      key={blockName}
                      href={href}
                      className={cn(
                        "flex items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                        active
                          ? ""
                          : "text-muted-foreground hover:bg-accent hover:text-foreground"
                      )}
                      style={
                        active
                          ? {
                              backgroundColor: hexToRgba(catColor, 0.1),
                              color: catColor,
                            }
                          : undefined
                      }
                    >
                      {Icon && (
                        <Icon
                          className="h-4 w-4 shrink-0"
                          style={{ color: catColor }}
                        />
                      )}
                      <span className="truncate">{label}</span>
                    </Link>
                  );
                })}
              </div>
            </div>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="shrink-0 border-t border-border px-3 py-2">
        <button
          onClick={() => setDialogOpen(true)}
          className="flex items-center justify-center gap-2 rounded-md px-3 py-1.5 text-xs font-medium text-muted-foreground hover:bg-accent hover:text-foreground transition-colors w-full"
        >
          <Settings2 className="h-3.5 w-3.5 shrink-0" />
          <span>Manage Blocks</span>
        </button>
      </div>

      <ManageBlocksDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        categories={categories}
        onSaveCategories={setCategories}
      />
    </div>
  );
}

// ─── Knowledge Sub-Panel (dynamic, grouped by category, no colors) ──

function KnowledgeSubPanel() {
  const pathname = usePathname();
  const { setSubPanelCollapsed } = useUIStore();
  const locale = useLocale();
  const t = useT();
  const [categories, setCategories] = useState<BlockCategory[]>(DEFAULT_BLOCK_CATEGORIES);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [dialogOpen, setDialogOpen] = useState(false);

  useEffect(() => {
    fetch("/api/settings")
      .then((res) => res.json())
      .then((json) => {
        const cats = json.data?.[BLOCK_CATEGORIES_SETTING_KEY]
          ? parseBlockCategories(json.data[BLOCK_CATEGORIES_SETTING_KEY])
          : DEFAULT_BLOCK_CATEGORIES;
        setCategories(cats);
        setSelected(parseKnowledgeBlocks(json.data?.[KNOWLEDGE_BLOCKS_SETTING_KEY]));
      })
      .catch(() => {});
  }, []);

  const items = useMemo(
    () => groupSelectedSources(selected, categories),
    [selected, categories]
  );

  const allBlockNames = useMemo(
    () => getAllBlocks().map((b) => b.name),
    []
  );

  const knowledgeTypeBlocks = useMemo(
    () => new Set<string>(KNOWLEDGE_TYPE_BLOCKS),
    []
  );

  function hrefForBlock(blockName: string): string {
    return knowledgeTypeBlocks.has(blockName)
      ? `/admin/knowledge/${blockName}`
      : `/admin/blocks/${blockName}`;
  }

  function isActive(href: string) {
    if (href === "/admin/knowledge") {
      return pathname === "/admin/knowledge";
    }
    return pathname === href || pathname.startsWith(href + "/");
  }

  return (
    <div
      className="shrink-0 flex flex-col border-r border-border bg-card h-screen transition-all duration-200 ease-in-out"
      style={{ width: SUB_PANEL_WIDTH }}
    >
      {/* Header */}
      <div className="flex items-center justify-between pt-6 pb-4">
        <h2 className="text-[16px] font-semibold truncate pl-6">Knowledge</h2>
        <button
          onClick={() => setSubPanelCollapsed(true)}
          className="text-muted-foreground hover:text-foreground transition-colors p-1.5 rounded-md hover:bg-accent mr-4"
          title={t("nav.subpanel.collapse")}
        >
          <PanelLeftClose className="h-4 w-4" />
        </button>
      </div>

      {/* Links */}
      <nav className="flex-1 pb-4 overflow-y-auto overscroll-contain px-3">
        {/* All Sources link */}
        <Link
          href="/admin/knowledge"
          className={cn(
            "flex items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium transition-colors",
            isActive("/admin/knowledge")
              ? "bg-primary/10 text-primary dark:bg-brand/10 dark:text-brand"
              : "text-muted-foreground hover:bg-accent hover:text-foreground"
          )}
        >
          <LayoutGrid className="h-4 w-4 shrink-0" />
          <span className="truncate">All Sources</span>
        </Link>

        {/* Category sections (no colors) */}
        {items.map((entry) => {
          const label =
            entry.categoryId === KNOWLEDGE_FALLBACK_CATEGORY_ID
              ? KNOWLEDGE_FALLBACK_CATEGORY_LABEL
              : getCategoryLabel(entry.categoryId, locale);
          return (
            <div key={entry.categoryId} className="mt-4">
              <p className="px-3 pb-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/70">
                {label}
              </p>
              {entry.blocks.map((blockName) => {
                const Icon = BLOCK_ICON_MAP[blockName];
                const linkLabel = getBlockLabel(blockName, locale);
                const href = hrefForBlock(blockName);
                const active = isActive(href);
                return (
                  <Link
                    key={blockName}
                    href={href}
                    className={cn(
                      "flex items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                      active
                        ? "bg-primary/10 text-primary dark:bg-brand/10 dark:text-brand"
                        : "text-muted-foreground hover:bg-accent hover:text-foreground"
                    )}
                  >
                    {Icon && <Icon className="h-4 w-4 shrink-0" />}
                    <span className="truncate">{linkLabel}</span>
                  </Link>
                );
              })}
            </div>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="shrink-0 border-t border-border px-3 py-2">
        <button
          onClick={() => setDialogOpen(true)}
          className="flex items-center justify-center gap-2 rounded-md px-3 py-1.5 text-xs font-medium text-muted-foreground hover:bg-accent hover:text-foreground transition-colors w-full"
        >
          <Settings2 className="h-3.5 w-3.5 shrink-0" />
          <span>Manage Sources</span>
        </button>
      </div>

      <ManageKnowledgeDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        value={selected}
        categories={categories}
        allBlockNames={allBlockNames}
        onSave={setSelected}
      />
    </div>
  );
}

// ─── Network Sub-Panel ─────────────────────────────────────────────
// Extracted to src/components/network/network-sub-panel.tsx in Etapa 1.5.6b-bis.
// This pattern (extract feature-specific sub-panel to its own file) will be
// replicated for BlocksSubPanel, KnowledgeSubPanel, MarketplaceSubPanel,
// ToolsSubPanel, OrganizationSubPanel in 1.5.6c-e.

// ─── Tools Sub-Panel (dynamic from registry) ────────────────────────

function ToolsSubPanel() {
  const pathname = usePathname();
  const { setSubPanelCollapsed } = useUIStore();
  const t = useT();
  const allCategories = getAllToolCategories();

  // When on /admin/tools/{slug}[/...] focus the sub-panel on that one
  // category. The slug can either be a category name (e.g. /admin/tools/sales)
  // or a single tool name (e.g. /admin/tools/projections) — in the latter
  // case we look up the tool's parent category.
  const segments = pathname.split("/").filter(Boolean); // ["admin","tools",...]
  const slug = segments[1] === "tools" ? segments[2] : undefined;
  let focusedCategory = slug
    ? allCategories.find((c) => c.name === slug)
    : undefined;
  if (!focusedCategory && slug) {
    const parent = allCategories.find((c) =>
      c.tools.some((t) => t.name === slug),
    );
    if (parent) focusedCategory = parent;
  }
  const categories = focusedCategory ? [focusedCategory] : allCategories;
  const panelTitle = focusedCategory ? focusedCategory.displayName : "Tools";
  const allToolsHref = focusedCategory
    ? `/admin/tools/${focusedCategory.name}`
    : "/admin/tools";

  const isActive = (href: string) => {
    if (href === allToolsHref) return pathname === allToolsHref;
    return pathname.startsWith(href);
  };

  return (
    <div
      className="shrink-0 flex flex-col border-r border-border bg-card h-screen transition-all duration-200 ease-in-out"
      style={{ width: SUB_PANEL_WIDTH }}
    >
      {/* Header */}
      <div className="flex items-center justify-between pt-6 pb-4">
        <h2 className="text-[16px] font-semibold truncate pl-6">{panelTitle}</h2>
        <button
          onClick={() => setSubPanelCollapsed(true)}
          className="text-muted-foreground hover:text-foreground transition-colors p-1.5 rounded-md hover:bg-accent mr-4"
          title={t("nav.subpanel.collapse")}
        >
          <PanelLeftClose className="h-4 w-4" />
        </button>
      </div>

      {/* Links */}
      <nav className="flex-1 pb-4 overflow-y-auto overscroll-contain px-3">
        {/* All Tools link */}
        <Link
          href={allToolsHref}
          className={cn(
            "flex items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium transition-colors",
            pathname === allToolsHref
              ? "bg-primary/10 text-primary dark:bg-brand/10 dark:text-brand"
              : "text-muted-foreground hover:bg-accent hover:text-foreground"
          )}
        >
          <LayoutGrid className="h-4 w-4 shrink-0" />
          <span className="truncate">All Tools</span>
        </Link>

        {/* Categories with tools */}
        {categories.map((category) => {
          const categoryColor = category.color;
          return (
            <div key={category.name} className="mt-4">
              <p className="px-3 pb-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/70">
                {category.displayName}
              </p>
              {category.tools.map((tool) => {
                const ToolIcon = TOOL_ICON_MAP[tool.icon];
                const href = `/admin/tools/${tool.name}`;
                const active = isActive(href);
                return (
                  <Link
                    key={tool.name}
                    href={href}
                    className={cn(
                      "flex items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                      active
                        ? ""
                        : "text-muted-foreground hover:bg-accent hover:text-foreground"
                    )}
                    style={
                      active
                        ? {
                            backgroundColor: hexToRgba(categoryColor, 0.1),
                            color: categoryColor,
                          }
                        : undefined
                    }
                  >
                    {ToolIcon && (
                      <ToolIcon
                        className="h-4 w-4 shrink-0"
                        style={{ color: categoryColor }}
                      />
                    )}
                    <span className="truncate">{tool.displayName}</span>
                  </Link>
                );
              })}
            </div>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="shrink-0 border-t border-border px-3 py-2">
        <button
          className="flex items-center justify-center gap-2 rounded-md px-3 py-1.5 text-xs font-medium text-muted-foreground hover:bg-accent hover:text-foreground transition-colors w-full"
        >
          <Settings2 className="h-3.5 w-3.5 shrink-0" />
          <span>Manage Tools</span>
        </button>
      </div>
    </div>
  );
}

// ─── Marketplace Sub-Panel (dynamic sections from DB) ───────────────

interface MarketplaceSectionRow {
  id: string;
  slug: string;
  name: string;
  iconKey: string | null;
  status: string;
}

function MarketplaceSubPanel() {
  const pathname = usePathname();
  const { setSubPanelCollapsed } = useUIStore();
  const t = useT();
  const { view: profileView } = useProfileView();
  const marketplaceTitle = profileView === "member" ? "Explore" : "Marketplace";
  // Hydrate state from cache on first render so we don't flash an empty
  // panel before the network responds. `loaded` differentiates "still
  // fetching for the first time" (show skeleton) from "fetched, empty"
  // (show 'No sections yet').
  const cached = typeof window !== "undefined" ? getCachedSections() : null;
  const [sections, setSections] = useState<MarketplaceSectionRow[]>(
    cached ?? []
  );
  const [loaded, setLoaded] = useState(cached !== null);
  const [manageOpen, setManageOpen] = useState(false);

  const refresh = () => {
    fetch("/api/marketplace/sections")
      .then((r) => r.json())
      .then((j) => {
        if (Array.isArray(j.data)) {
          const next: CachedSection[] = (j.data as MarketplaceSectionRow[]).map(
            (s) => ({
              id: s.id,
              slug: s.slug,
              name: s.name,
              iconKey: s.iconKey ?? null,
              status: s.status,
            })
          );
          setSections(next);
          setCachedSections(next);
          setLoaded(true);
        }
      })
      .catch(() => setLoaded(true));
  };

  useEffect(() => {
    // Always revalidate in the background (stale-while-revalidate).
    refresh();
    const onUpdated = () => {
      invalidateSectionsCache();
      refresh();
    };
    window.addEventListener("marketplace-sections-updated", onUpdated);
    return () =>
      window.removeEventListener("marketplace-sections-updated", onUpdated);
  }, []);

  const isActive = (href: string) => pathname.startsWith(href);

  return (
    <div
      className="shrink-0 flex flex-col border-r border-border bg-card h-screen transition-all duration-200 ease-in-out"
      style={{ width: SUB_PANEL_WIDTH }}
    >
      {/* Header */}
      <div className="flex items-center justify-between pt-6 pb-4">
        <h2 className="text-[16px] font-semibold truncate pl-6">{marketplaceTitle}</h2>
        <button
          onClick={() => setSubPanelCollapsed(true)}
          className="text-muted-foreground hover:text-foreground transition-colors p-1.5 rounded-md hover:bg-accent mr-4"
          title={t("nav.subpanel.collapse")}
        >
          <PanelLeftClose className="h-4 w-4" />
        </button>
      </div>

      {/* Links — sections directly under the title */}
      <nav className="flex-1 pb-4 overflow-y-auto overscroll-contain px-3 space-y-0.5">
        {sections.length === 0 && !loaded && (
          // First-time load with no cache — show 3 skeleton rows so we
          // don't flash a misleading "No sections yet".
          <>
            {[0, 1, 2].map((i) => (
              <div
                key={`skel-${i}`}
                className="flex items-center gap-2.5 px-3 py-2"
              >
                <div className="h-4 w-4 rounded bg-muted animate-pulse" />
                <div
                  className="h-3 rounded bg-muted animate-pulse"
                  style={{ width: `${60 + i * 15}%` }}
                />
              </div>
            ))}
          </>
        )}
        {sections.length === 0 && loaded && (
          <p className="px-3 py-2 text-xs text-muted-foreground italic">
            No sections yet.
          </p>
        )}
        {sections.map((s) => {
          const href = `/admin/marketplace/sections/${s.id}`;
          const active = isActive(href);
          return (
            <Link
              key={s.id}
              href={href}
              className={cn(
                "flex items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                active
                  ? "bg-primary/10 text-primary dark:bg-brand/10 dark:text-brand"
                  : "text-muted-foreground hover:bg-accent hover:text-foreground"
              )}
            >
              <ShoppingBag className="h-4 w-4 shrink-0" />
              <span className="truncate flex-1">{s.name}</span>
              {s.status === "DRAFT" && (
                <span className="text-[9px] uppercase tracking-wider text-muted-foreground">
                  draft
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="shrink-0 border-t border-border px-3 py-2">
        <button
          onClick={() => setManageOpen(true)}
          className="flex items-center justify-center gap-2 rounded-md px-3 py-1.5 text-xs font-medium text-muted-foreground hover:bg-accent hover:text-foreground transition-colors w-full"
        >
          <Settings2 className="h-3.5 w-3.5 shrink-0" />
          <span>Manage Sections</span>
        </button>
      </div>

      <ManageSectionsDialog
        open={manageOpen}
        onOpenChange={setManageOpen}
        sections={sections}
        onChange={refresh}
      />
    </div>
  );
}

// ─── Organization Sub-Panel (categorized, no colors) ────────────────

function OrganizationSubPanel() {
  const pathname = usePathname();
  const { setSubPanelCollapsed } = useUIStore();
  const t = useT();
  const config = subPanelRegistry.organization;
  const categories = config?.categories ?? [];

  const allHrefs = categories.flatMap((cat) => cat.links.map((l) => l.href));
  const activeHref = allHrefs
    .filter((href) => pathname === href || pathname.startsWith(href + "/"))
    .sort((a, b) => b.length - a.length)[0];

  return (
    <div
      className="shrink-0 flex flex-col border-r border-border bg-card h-screen transition-all duration-200 ease-in-out"
      style={{ width: SUB_PANEL_WIDTH }}
    >
      {/* Header */}
      <div className="flex items-center justify-between pt-6 pb-4">
        <h2 className="text-[16px] font-semibold truncate pl-6">
          {config.labelKey ? t(config.labelKey as MessageKey) : config.label}
        </h2>
        <button
          onClick={() => setSubPanelCollapsed(true)}
          className="text-muted-foreground hover:text-foreground transition-colors p-1.5 rounded-md hover:bg-accent mr-4"
          title={t("nav.subpanel.collapse")}
        >
          <PanelLeftClose className="h-4 w-4" />
        </button>
      </div>

      {/* Categories */}
      <nav className="flex-1 pb-4 overflow-y-auto overscroll-contain px-3">
        {categories.map((cat) => (
          <div key={cat.id} className="mt-4 first:mt-0">
            <p className="px-3 pb-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/70">
              {cat.labelKey ? t(cat.labelKey as MessageKey) : cat.label}
            </p>
            {cat.links.map((link) => {
              const active = link.href === activeHref;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    "flex items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                    active
                      ? "bg-primary/10 text-primary dark:bg-brand/10 dark:text-brand"
                      : "text-muted-foreground hover:bg-accent hover:text-foreground"
                  )}
                >
                  {link.icon && <link.icon className="h-4 w-4 shrink-0" />}
                  <span className="truncate">
                    {link.labelKey ? t(link.labelKey as MessageKey) : link.label}
                  </span>
                </Link>
              );
            })}
          </div>
        ))}
      </nav>
    </div>
  );
}

// ─── Handbook Sub-Panel (5 layers + meta, from search-index) ────────

interface HandbookIndexEntry {
  uid: string;
  id: string;
  level: string;
  title_pt_BR: string;
  title_en_US: string;
}

// Display order for the 5 fixed layers.
const LAYER_ORDER = ["networks", "solutions", "tools", "blocks", "integrations"];

function HandbookSubPanel() {
  const pathname = usePathname();
  const { setSubPanelCollapsed } = useUIStore();
  const adminLocale = useLocale();
  const handbookLocale = adminLocaleToHandbookLocale(adminLocale);
  const titleOf = (e: HandbookIndexEntry) =>
    handbookLocale === "pt-BR" ? e.title_pt_BR : e.title_en_US;

  const { layers, metaEntries } = useMemo(() => {
    const all = (searchIndex as { entries: HandbookIndexEntry[] }).entries;
    const layerMap = new Map<string, HandbookIndexEntry>();
    const meta: HandbookIndexEntry[] = [];
    for (const e of all) {
      if (e.level === "layer") layerMap.set(e.id, e);
      else if (e.level === "meta") meta.push(e);
    }
    const layers = LAYER_ORDER
      .map((id) => layerMap.get(id))
      .filter((e): e is HandbookIndexEntry => Boolean(e));
    meta.sort((a, b) =>
      handbookLocale === "pt-BR"
        ? a.title_pt_BR.localeCompare(b.title_pt_BR)
        : a.title_en_US.localeCompare(b.title_en_US),
    );
    return { layers, metaEntries: meta };
  }, [handbookLocale]);

  const isActive = (href: string) => {
    if (href === "/admin/handbook") return pathname === "/admin/handbook";
    return pathname === href || pathname.startsWith(href + "/");
  };

  return (
    <div
      className="shrink-0 flex flex-col border-r border-border bg-card h-screen transition-all duration-200 ease-in-out"
      style={{ width: SUB_PANEL_WIDTH }}
    >
      {/* Header */}
      <div className="flex items-center justify-between pt-6 pb-4">
        <h2 className="text-[16px] font-semibold truncate pl-6">Handbook</h2>
        <button
          onClick={() => setSubPanelCollapsed(true)}
          className="text-muted-foreground hover:text-foreground transition-colors p-1.5 rounded-md hover:bg-accent mr-4"
          title="Collapse panel"
        >
          <PanelLeftClose className="h-4 w-4" />
        </button>
      </div>

      {/* Links — same shape as BlocksSubPanel: top-level link, then
          category sections (mt-4), each with a label + space-y-2 stack
          of 8px-gapped links. */}
      <nav className="flex-1 pb-4 overflow-y-auto overscroll-contain px-3">
        {/* Overview link */}
        <Link
          href="/admin/handbook"
          className={cn(
            "flex items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium transition-colors",
            isActive("/admin/handbook")
              ? "bg-primary/10 text-primary dark:bg-brand/10 dark:text-brand"
              : "text-muted-foreground hover:bg-accent hover:text-foreground",
          )}
        >
          <LayoutGrid className="h-4 w-4 shrink-0" />
          <span className="truncate">Overview</span>
        </Link>

        {/* Layers section */}
        <div className="mt-4">
          <p className="px-3 pb-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/70">
            Layers
          </p>
          <div className="space-y-2">
            {layers.map((entry) => {
              const href = `/admin/handbook/${entry.id}`;
              const active = isActive(href);
              return (
                <Link
                  key={entry.uid}
                  href={href}
                  className={cn(
                    "flex items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                    active
                      ? "bg-primary/10 text-primary dark:bg-brand/10 dark:text-brand"
                      : "text-muted-foreground hover:bg-accent hover:text-foreground",
                  )}
                >
                  <span className="truncate">{titleOf(entry)}</span>
                </Link>
              );
            })}
          </div>
        </div>

        {/* Meta entries (about the handbook itself) — no divider above; the
            section gap matches Blocks. */}
        {metaEntries.length > 0 && (
          <div className="mt-4">
            <p className="px-3 pb-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/70">
              Meta
            </p>
            <div className="space-y-2">
              {metaEntries.map((entry) => {
                const href = `/admin/handbook/meta/${entry.id}`;
                const active = isActive(href);
                return (
                  <Link
                    key={entry.uid}
                    href={href}
                    className={cn(
                      "flex items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                      active
                        ? "bg-primary/10 text-primary dark:bg-brand/10 dark:text-brand"
                        : "text-muted-foreground hover:bg-accent hover:text-foreground",
                    )}
                  >
                    <span className="truncate">{titleOf(entry)}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        )}
      </nav>
    </div>
  );
}

// ─── Generic Sub-Panel (static registry) ─────────────────────────────

function GenericSubPanel({ config }: { config: SubPanelConfig }) {
  const pathname = usePathname();
  const { setSubPanelCollapsed } = useUIStore();
  const t = useT();

  const isActive = (href: string) => {
    // First link gets exact match only (e.g. "All Users" not when on sub-pages)
    if (href === config.links[0]?.href) {
      return pathname === href;
    }
    return pathname.startsWith(href);
  };

  return (
    <div
      className="shrink-0 flex flex-col border-r border-border bg-card h-screen transition-all duration-200 ease-in-out"
      style={{ width: SUB_PANEL_WIDTH }}
    >
      {/* Header */}
      <div className="flex items-center justify-between pt-6 pb-4">
        <h2 className="text-[16px] font-semibold truncate pl-6">
          {config.labelKey ? t(config.labelKey as MessageKey) : config.label}
        </h2>
        <button
          onClick={() => setSubPanelCollapsed(true)}
          className="text-muted-foreground hover:text-foreground transition-colors p-1.5 rounded-md hover:bg-accent mr-4"
          title={t("nav.subpanel.collapse")}
        >
          <PanelLeftClose className="h-4 w-4" />
        </button>
      </div>

      {/* Links */}
      <nav className="flex-1 pb-4 space-y-2.5 px-3">
        {config.links.map((link) => {
          const active = isActive(link.href);
          return (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "flex items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                active
                  ? "bg-primary/10 text-primary dark:bg-brand/10 dark:text-brand"
                  : "text-muted-foreground hover:bg-accent hover:text-foreground"
              )}
            >
              {link.icon && <link.icon className="h-4 w-4 shrink-0" />}
              <span className="truncate">
                {link.labelKey ? t(link.labelKey as MessageKey) : link.label}
              </span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}

// ─── Main Component ──────────────────────────────────────────────────

export function SubPanel() {
  const { subPanelId, subPanelCollapsed } = useUIStore();

  if (!subPanelId || subPanelCollapsed) return null;

  // Custom sub-panels
  if (subPanelId === "blocks") return <BlocksSubPanel />;
  if (subPanelId === "knowledge") return <KnowledgeSubPanel />;
  if (subPanelId === "tools") return <ToolsSubPanel />;
  if (subPanelId === "marketplace") return <MarketplaceSubPanel />;
  if (subPanelId === "organization") return <OrganizationSubPanel />;
  if (subPanelId === "handbook") return <HandbookSubPanel />;

  // All other panels use static registry
  const config = subPanelRegistry[subPanelId];
  if (!config) return null;

  return <GenericSubPanel config={config} />;
}
