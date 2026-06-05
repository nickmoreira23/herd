import {
  Home,
  MessageSquare,
  Brain,
  Compass,
  LayoutDashboard,
  ShoppingBag,
  Receipt,
  Bot,
  Bell,
  LifeBuoy,
  BookOpen,
  Plug,
  Blocks as BlocksIcon,
  LayoutGrid,
  KanbanSquare,
  Dumbbell,
  Apple,
  DollarSign,
  Folder,
  GraduationCap,
  Users,
  Building2,
  type LucideIcon,
} from "lucide-react";
import { getAllToolCategories } from "@/lib/tools/registry";
import {
  CATEGORY_ICON_MAP,
  TOOL_ICON_MAP,
  DEFAULT_CATEGORY_ICON,
} from "@/lib/tools/category-meta";
import type { ProfileView } from "@/lib/core/profile-view/types";
import type { MessageKey } from "@/lib/i18n/t";

export interface NavLink {
  type: "link";
  href: string;
  label: string;
  /** i18n key; when set the renderer uses t(labelKey), falling back to label. */
  labelKey?: MessageKey;
  icon: LucideIcon;
  /** When set, render a colored square in the icon slot instead of the LucideIcon. */
  squareColor?: string;
}

export interface NavGroup {
  type: "group";
  label: string;
  labelKey?: MessageKey;
  icon: LucideIcon;
  children: NavLink[];
}

export type NavItem = NavLink | NavGroup;

export interface MiddleSection {
  /** Section title shown as a heading row (e.g., "Work", "Workflow", "Tools"). */
  label: string;
  /** i18n key; when set the renderer uses t(labelKey), falling back to label. */
  labelKey?: MessageKey;
  /** Icon shown in the heading row, same hierarchy as top items. */
  icon: LucideIcon;
  items: NavItem[];
}

export interface ProfileNav {
  top: NavItem[];
  middle: MiddleSection | null;
  bottom: NavItem[];
}

function resolveIcon(name: string | undefined): LucideIcon {
  if (!name) return DEFAULT_CATEGORY_ICON;
  return CATEGORY_ICON_MAP[name] ?? TOOL_ICON_MAP[name] ?? DEFAULT_CATEGORY_ICON;
}

function categoryToSquareLink(
  name: string,
  displayName: string,
  icon: string | undefined,
  color: string | undefined,
): NavLink {
  return {
    type: "link",
    href: `/admin/tools/${name}`,
    label: displayName,
    icon: resolveIcon(icon),
    squareColor: color,
  };
}

// Explicit display order for tool categories in the middle section.
const CATEGORY_ORDER = ["legal", "marketing", "sales", "operations", "finances"] as const;

function orderedCategories() {
  const all = getAllToolCategories();
  const result = [];
  for (const name of CATEGORY_ORDER) {
    const cat = all.find((c) => c.name === name);
    if (cat) result.push(cat);
  }
  return result;
}

export function buildNavForView(view: ProfileView): ProfileNav {
  const allCategories = orderedCategories();

  if (view === "member") {
    const SPACE_SQUARE = "#6b7280";
    const spaces: NavItem[] = [
      { type: "link", href: "/admin/spaces/exercise", label: "Exercise", labelKey: "nav.sidebar.exercise", icon: Dumbbell, squareColor: SPACE_SQUARE },
      { type: "link", href: "/admin/spaces/nutrition", label: "Nutrition", labelKey: "nav.sidebar.nutrition", icon: Apple, squareColor: SPACE_SQUARE },
    ];

    return {
      top: [
        { type: "link", href: "/admin/home", label: "Home", labelKey: "nav.sidebar.home", icon: Home },
        { type: "link", href: "/admin/chat", label: "Chat", labelKey: "nav.sidebar.chat", icon: MessageSquare },
        { type: "link", href: "/admin/learn", label: "Learn", labelKey: "nav.sidebar.learn", icon: GraduationCap },
        { type: "link", href: "/admin/marketplace", label: "Explore", labelKey: "nav.sidebar.explore", icon: Compass },
      ],
      middle: { label: "Fitness Spaces", labelKey: "nav.sidebar.fitness_spaces", icon: LayoutGrid, items: spaces },
      bottom: [
        { type: "link", href: "/admin/notifications", label: "Notifications", labelKey: "nav.sidebar.notifications", icon: Bell },
        { type: "link", href: "/admin/memories", label: "Memories", labelKey: "nav.sidebar.memories", icon: Brain },
        { type: "link", href: "/admin/help", label: "Help Center", labelKey: "nav.sidebar.help_center", icon: LifeBuoy },
      ],
    };
  }

  if (view === "reseller") {
    const marketing = allCategories.find((c) => c.name === "marketing");
    const sales = allCategories.find((c) => c.name === "sales");
    const middleItems: NavItem[] = [];
    if (marketing) middleItems.push(categoryToSquareLink(marketing.name, marketing.displayName, marketing.icon, marketing.color));
    if (sales) middleItems.push(categoryToSquareLink(sales.name, sales.displayName, sales.icon, sales.color));

    return {
      top: [
        { type: "link", href: "/admin", label: "Dashboard", labelKey: "nav.sidebar.dashboard", icon: LayoutDashboard },
        { type: "link", href: "/admin/chat", label: "Chat", labelKey: "nav.sidebar.chat", icon: MessageSquare },
        { type: "link", href: "/admin/knowledge", label: "Organize", labelKey: "nav.sidebar.organize", icon: Folder },
        { type: "link", href: "/admin/marketplace", label: "Sell", labelKey: "nav.sidebar.sell", icon: ShoppingBag },
        { type: "link", href: "/admin/earnings", label: "Earn", labelKey: "nav.sidebar.earn", icon: DollarSign },
      ],
      middle: { label: "Work", labelKey: "nav.sidebar.work", icon: LayoutGrid, items: middleItems },
      bottom: [
        { type: "link", href: "/admin/notifications", label: "Notifications", labelKey: "nav.sidebar.notifications", icon: Bell },
        { type: "link", href: "/admin/memories", label: "Memories", labelKey: "nav.sidebar.memories", icon: Brain },
        { type: "link", href: "/admin/roadmap", label: "Roadmap", labelKey: "nav.sidebar.roadmap", icon: KanbanSquare },
        { type: "link", href: "/admin/help", label: "Help Center", labelKey: "nav.sidebar.help_center", icon: LifeBuoy },
      ],
    };
  }

  if (view === "organization") {
    return {
      top: [
        { type: "link", href: "/admin", label: "Dashboard", labelKey: "nav.sidebar.dashboard", icon: LayoutDashboard },
        { type: "link", href: "/admin/chat", label: "Chat", labelKey: "nav.sidebar.chat", icon: MessageSquare },
        { type: "link", href: "/admin/organization/profile", label: "Organization", labelKey: "nav.sidebar.organization", icon: Building2 },
        { type: "link", href: "/admin/organization/members", label: "Members", labelKey: "nav.sidebar.members", icon: Users },
        { type: "link", href: "/admin/knowledge", label: "Knowledge", labelKey: "nav.sidebar.knowledge", icon: Brain },
        { type: "link", href: "/admin/marketplace", label: "Marketplace", labelKey: "nav.sidebar.marketplace", icon: ShoppingBag },
      ],
      middle: {
        label: "Workflow",
        labelKey: "nav.sidebar.workflow",
        icon: LayoutGrid,
        items: allCategories.map((c) => categoryToSquareLink(c.name, c.displayName, c.icon, c.color)),
      },
      bottom: [
        { type: "link", href: "/admin/blocks", label: "Blocks", labelKey: "nav.sidebar.blocks", icon: BlocksIcon },
        { type: "link", href: "/admin/integrations", label: "Integrations", labelKey: "nav.sidebar.integrations", icon: Plug },
        { type: "link", href: "/admin/roadmap", label: "Roadmap", labelKey: "nav.sidebar.roadmap", icon: KanbanSquare },
        { type: "link", href: "/admin/help", label: "Help Center", labelKey: "nav.sidebar.help_center", icon: LifeBuoy },
      ],
    };
  }

  // orchestrator
  return {
    top: [
      { type: "link", href: "/admin", label: "Dashboard", labelKey: "nav.sidebar.dashboard", icon: LayoutDashboard },
      { type: "link", href: "/admin/chat", label: "Chat", labelKey: "nav.sidebar.chat", icon: MessageSquare },
      { type: "link", href: "/admin/agents", label: "Agents", labelKey: "nav.sidebar.agents", icon: Bot },
      { type: "link", href: "/admin/knowledge", label: "Knowledge", labelKey: "nav.sidebar.knowledge", icon: Brain },
      { type: "link", href: "/admin/marketplace", label: "Marketplace", labelKey: "nav.sidebar.marketplace", icon: ShoppingBag },
      { type: "link", href: "/admin/ledger", label: "Ledger", labelKey: "nav.sidebar.ledger", icon: Receipt },
      { type: "link", href: "/admin/organization/profile", label: "Organization", labelKey: "nav.sidebar.organization", icon: Building2 },
    ],
    middle: {
      label: "Tools",
      labelKey: "nav.sidebar.tools",
      icon: LayoutGrid,
      items: allCategories.map((c) => categoryToSquareLink(c.name, c.displayName, c.icon, c.color)),
    },
    bottom: [
      { type: "link", href: "/admin/blocks", label: "Blocks", labelKey: "nav.sidebar.blocks", icon: BlocksIcon },
      { type: "link", href: "/admin/integrations", label: "Integrations", labelKey: "nav.sidebar.integrations", icon: Plug },
      { type: "link", href: "/admin/roadmap", label: "Roadmap", labelKey: "nav.sidebar.roadmap", icon: KanbanSquare },
      { type: "link", href: "/admin/handbook", label: "Handbook", labelKey: "nav.sidebar.handbook", icon: BookOpen },
      { type: "link", href: "/admin/help", label: "Help Center", labelKey: "nav.sidebar.help_center", icon: LifeBuoy },
    ],
  };
}
