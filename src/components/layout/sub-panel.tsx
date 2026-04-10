"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { PanelLeftClose, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { useUIStore } from "@/stores/ui-store";

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
import {
  Users,
  Layers,
  Shield,
  LayoutGrid,
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
  Package,
  Bot,
  Handshake,
  Gift,
  Calendar,
  CheckSquare,
  Receipt,
  CreditCard,
  BarChart3,
  Megaphone,
  Mail,
  LifeBuoy,
  Kanban,
  Box,
  Brain,
} from "lucide-react";

export const subPanelRegistry: Record<string, SubPanelConfig> = {
  blocks: {
    id: "blocks",
    label: "Blocks",
    links: [
      { href: "/admin/blocks", label: "Pages", icon: LayoutGrid },
      { href: "/admin/blocks/meetings", label: "Meetings", icon: Video },
      { href: "/admin/blocks/events", label: "Events", icon: Calendar },
      { href: "/admin/blocks/tasks", label: "Tasks", icon: CheckSquare },
    ],
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
      { href: "/admin/organization/knowledge", label: "Documents", icon: FileText },
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
  benefits: {
    id: "benefits",
    label: "Benefits",
    links: [
      { href: "/admin/products", label: "Products", icon: Package },
      { href: "/admin/agents", label: "Agents", icon: Bot },
      { href: "/admin/brands", label: "Partners", icon: Handshake },
      { href: "/admin/perks", label: "Perks", icon: Gift },
      { href: "/admin/community", label: "Community", icon: Users },
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
};

// Map a sidebar href to a sub-panel ID (if it should open one)
export const hrefToSubPanel: Record<string, string> = {
  "/admin/blocks": "blocks",
  "/admin/organization/profile": "profile",
  "/admin/organization/knowledge": "knowledge",
  "/admin/organization/users": "users",
  "/admin/program/benefits": "benefits",
  "/admin/organization/brand-kit": "brand-kit",
  "/admin/integrations": "integrations",
};

// All hrefs that belong to a sub-panel (used to auto-detect active panel from pathname)
export function getSubPanelIdForPath(pathname: string): string | null {
  for (const [, config] of Object.entries(subPanelRegistry)) {
    if (config.links.some((link) => pathname.startsWith(link.href))) {
      return config.id;
    }
  }
  return null;
}

// ─── Sub-panel width ─────────────────────────────────────────────────

export const SUB_PANEL_WIDTH = 240; // px

// ─── Component ───────────────────────────────────────────────────────

export function SubPanel() {
  const pathname = usePathname();
  const { subPanelId, subPanelCollapsed, setSubPanelCollapsed } = useUIStore();

  const config = subPanelId ? subPanelRegistry[subPanelId] : null;

  // Completely hidden when collapsed or no config
  if (!config || subPanelCollapsed) return null;

  const isActive = (href: string) => {
    // "All Users" — exact match only (not when on profile-types or roles)
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
