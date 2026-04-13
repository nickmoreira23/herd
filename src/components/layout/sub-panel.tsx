"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
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
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useUIStore } from "@/stores/ui-store";
import { BLOCK_ICON_MAP, BLOCK_LABEL_MAP } from "@/lib/blocks/block-meta";
import { getAllSolutions } from "@/lib/solutions/registry";
import { TOOL_ICON_MAP } from "@/lib/solutions/solution-meta";
import type { BlockCategory } from "@/lib/blocks/block-categories";
import {
  DEFAULT_BLOCK_CATEGORIES,
  DEFAULT_CATEGORY_COLOR,
  BLOCK_CATEGORIES_SETTING_KEY,
  parseBlockCategories,
  hexToRgba,
} from "@/lib/blocks/block-categories";
import { ManageBlocksDialog } from "@/components/blocks/manage-blocks-dialog";

// ─── Sub-panel config ────────────────────────────────────────────────

export interface SubPanelLink {
  href: string;
  label: string;
  icon?: LucideIcon;
}

export interface SubPanelConfig {
  id: string;
  label: string;
  links: SubPanelLink[];
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
  profile: {
    id: "profile",
    label: "Profile",
    links: [
      { href: "/admin/organization/profile", label: "General Information", icon: Building2 },
      { href: "/admin/organization/profile/contact", label: "Contact Information", icon: Phone },
      { href: "/admin/organization/profile/locations", label: "Locations", icon: MapPin },
      { href: "/admin/organization/profile/business-hours", label: "Business Hours", icon: Clock },
      { href: "/admin/organization/profile/regional-settings", label: "Regional Settings", icon: Globe },
    ],
  },
  knowledge: {
    id: "knowledge",
    label: "Knowledge",
    links: [
      { href: "/admin/organization/knowledge", label: "Dashboard", icon: LayoutGrid },
      { href: "/admin/organization/knowledge/documents", label: "Documents", icon: FileText },
      { href: "/admin/organization/knowledge/images", label: "Images", icon: Image },
      { href: "/admin/organization/knowledge/videos", label: "Videos", icon: Video },
      { href: "/admin/organization/knowledge/audios", label: "Audios", icon: Music },
      { href: "/admin/organization/knowledge/tables", label: "Tables", icon: Table2 },
      { href: "/admin/organization/knowledge/forms", label: "Forms", icon: ClipboardList },
      { href: "/admin/organization/knowledge/links", label: "Links", icon: Link2 },
      { href: "/admin/organization/knowledge/feeds", label: "Feeds", icon: Rss },
      { href: "/admin/organization/knowledge/apps", label: "Apps", icon: Plug },
    ],
  },
  users: {
    id: "users",
    label: "Users",
    links: [
      { href: "/admin/organization/users", label: "All Users", icon: Users },
      { href: "/admin/organization/org-chart", label: "Org Chart", icon: GitBranch },
      { href: "/admin/organization/departments", label: "Departments", icon: Building2 },
      { href: "/admin/organization/network-map", label: "Network Map", icon: Share2 },
      { href: "/admin/network/profile-types", label: "Profile Types", icon: Layers },
      { href: "/admin/network/roles", label: "Roles & Permissions", icon: Shield },
    ],
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
  "brand-kit": {
    id: "brand-kit",
    label: "Brand Kit",
    links: [
      { href: "/admin/organization/brand-kit", label: "All Assets", icon: LayoutGrid },
      { href: "/admin/organization/brand-kit/logos", label: "Logos", icon: Image },
      { href: "/admin/organization/brand-kit/colors", label: "Colors", icon: Palette },
      { href: "/admin/organization/brand-kit/fonts", label: "Fonts", icon: Type },
      { href: "/admin/organization/brand-kit/buttons", label: "Buttons", icon: RectangleHorizontal },
      { href: "/admin/organization/brand-kit/appearance", label: "Appearance", icon: Sparkles },
      { href: "/admin/organization/brand-kit/brand-voice", label: "Brand Voice", icon: MessageSquare },
    ],
  },
  solutions: {
    id: "solutions",
    label: "Solutions",
    links: [], // Dynamically rendered by SolutionsSubPanel
  },
};

// Map a sidebar href to a sub-panel ID (if it should open one)
export const hrefToSubPanel: Record<string, string> = {
  "/admin/agents": "agents",
  "/admin/blocks": "blocks",
  "/admin/solutions": "solutions",
  "/admin/organization/profile": "profile",
  "/admin/organization/knowledge": "knowledge",
  "/admin/organization/users": "users",
  "/admin/organization/brand-kit": "brand-kit",
  "/admin/integrations": "integrations",
};

// All hrefs that belong to a sub-panel (used to auto-detect active panel from pathname)
export function getSubPanelIdForPath(pathname: string): string | null {
  if (pathname.startsWith("/admin/blocks")) return "blocks";
  if (pathname.startsWith("/admin/agents")) return "agents";
  if (pathname.startsWith("/admin/solutions")) return "solutions";

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
          title="Collapse panel"
        >
          <PanelLeftClose className="h-4 w-4" />
        </button>
      </div>

      {/* Links */}
      <nav className="flex-1 pb-4 overflow-y-auto px-3">
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
                {cat.label}
              </p>
              {cat.blocks.map((blockName) => {
                const Icon = BLOCK_ICON_MAP[blockName];
                const label = BLOCK_LABEL_MAP[blockName] ?? blockName;
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

// ─── Solutions Sub-Panel (dynamic from registry) ────────────────────

function SolutionsSubPanel() {
  const pathname = usePathname();
  const { setSubPanelCollapsed } = useUIStore();
  const solutions = getAllSolutions();

  const isActive = (href: string) => {
    if (href === "/admin/solutions") return pathname === "/admin/solutions";
    return pathname.startsWith(href);
  };

  return (
    <div
      className="shrink-0 flex flex-col border-r border-border bg-card h-screen transition-all duration-200 ease-in-out"
      style={{ width: SUB_PANEL_WIDTH }}
    >
      {/* Header */}
      <div className="flex items-center justify-between pt-6 pb-4">
        <h2 className="text-[16px] font-semibold truncate pl-6">Solutions</h2>
        <button
          onClick={() => setSubPanelCollapsed(true)}
          className="text-muted-foreground hover:text-foreground transition-colors p-1.5 rounded-md hover:bg-accent mr-4"
          title="Collapse panel"
        >
          <PanelLeftClose className="h-4 w-4" />
        </button>
      </div>

      {/* Links */}
      <nav className="flex-1 pb-4 overflow-y-auto px-3">
        {/* All Solutions link */}
        <Link
          href="/admin/solutions"
          className={cn(
            "flex items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium transition-colors",
            pathname === "/admin/solutions"
              ? "bg-primary/10 text-primary dark:bg-brand/10 dark:text-brand"
              : "text-muted-foreground hover:bg-accent hover:text-foreground"
          )}
        >
          <LayoutGrid className="h-4 w-4 shrink-0" />
          <span className="truncate">All Solutions</span>
        </Link>

        {/* Solution categories with tools */}
        {solutions.map((solution) => {
          const solutionColor = solution.color;
          return (
            <div key={solution.name} className="mt-4">
              <p className="px-3 pb-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/70">
                {solution.displayName}
              </p>
              {solution.tools.map((tool) => {
                const ToolIcon = TOOL_ICON_MAP[tool.icon];
                const href = `/admin/solutions/${solution.name}/${tool.name}`;
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
                            backgroundColor: hexToRgba(solutionColor, 0.1),
                            color: solutionColor,
                          }
                        : undefined
                    }
                  >
                    {ToolIcon && (
                      <ToolIcon
                        className="h-4 w-4 shrink-0"
                        style={{ color: solutionColor }}
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
          <span>Manage Solutions</span>
        </button>
      </div>
    </div>
  );
}

// ─── Generic Sub-Panel (static registry) ─────────────────────────────

function GenericSubPanel({ config }: { config: SubPanelConfig }) {
  const pathname = usePathname();
  const { setSubPanelCollapsed } = useUIStore();

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
        <h2 className="text-[16px] font-semibold truncate pl-6">{config.label}</h2>
        <button
          onClick={() => setSubPanelCollapsed(true)}
          className="text-muted-foreground hover:text-foreground transition-colors p-1.5 rounded-md hover:bg-accent mr-4"
          title="Collapse panel"
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
              <span className="truncate">{link.label}</span>
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
  if (subPanelId === "solutions") return <SolutionsSubPanel />;

  // All other panels use static registry
  const config = subPanelRegistry[subPanelId];
  if (!config) return null;

  return <GenericSubPanel config={config} />;
}
